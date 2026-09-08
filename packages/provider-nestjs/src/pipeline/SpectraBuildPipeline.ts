import {
    FileSystemSpectraWriter,
    MsgpackGzipEncoder,
    resolveSpectraBinPath,
    SpectraError,
    type IDocumentationEncoder,
    type IDocumentationWriter,
} from "@spectra/core";

import { DocumentationBuilder } from "../documentation/DocumentationBuilder";

import { PipelineError } from "./errors/PipelineError";
import type { IDocumentationBuilder } from "./interfaces/IDocumentationBuilder";
import type {
    IDocumentationPipeline,
    PipelineRunOptions,
    PipelineRunResult,
} from "./interfaces/IDocumentationPipeline";

/**
 * Production pipeline: build → encode → write.
 *
 * <p>This class is the only place in the codebase that orchestrates
 * the three collaborators. Each collaborator is injected through its
 * interface so a different builder, encoder, or writer can be
 * substituted without modifying this class (Dependency Inversion).</p>
 *
 * <p>Default collaborators are wired when the pipeline is constructed
 * without arguments — `DocumentationBuilder` for the build stage,
 * `MsgpackGzipEncoder` for the encode stage, and the filesystem
 * writer for the write stage. Tests and tooling can override any of
 * the three.</p>
 */
export class SpectraBuildPipeline implements IDocumentationPipeline {
    private readonly projectRoot: string;
    private readonly builder: IDocumentationBuilder;
    private readonly encoder: IDocumentationEncoder;
    private readonly writer: IDocumentationWriter;

    public constructor(
        projectRoot: string,
        options?: {
            readonly builder?: IDocumentationBuilder;
            readonly encoder?: IDocumentationEncoder;
            readonly writer?: IDocumentationWriter;
        },
    ) {
        this.projectRoot = projectRoot;

        // Default collaborator wiring — mirrors what production code
        // needs and what most tests want. Each can be overridden via
        // the constructor options for testability / extensibility.
        const encoder = options?.encoder ?? new MsgpackGzipEncoder();
        const writer = options?.writer ?? new FileSystemSpectraWriter(encoder);
        const builder = options?.builder ?? new DocumentationBuilder(projectRoot);

        this.builder = builder;
        this.encoder = encoder;
        this.writer = writer;
    }

    public async run(
        options?: PipelineRunOptions,
    ): Promise<PipelineRunResult> {
        const startedAt = Date.now();
        const destination = options?.destination ?? resolveSpectraBinPath(this.projectRoot);

        // Stage 1 — Build. The builder is synchronous today but we
        // keep the pipeline async to leave room for builders that
        // resolve type information lazily.
        let documentation;
        try {
            documentation = this.builder.build();
        } catch (cause) {
            throw new PipelineError(
                `Pipeline failed during build stage: ${describe(cause)}`,
                "build",
                { cause },
            );
        }

        // Stage 2 — Pre-flight encode. We don't keep the result —
        // the writer re-encodes internally to keep encode+write
        // atomic. Calling encode() here is just a dry-run that lets
        // format errors surface at the right stage with a useful
        // message instead of being reported as a write failure.
        try {
            await this.encoder.encode(documentation, {
                metadata: options?.metadata,
            });
        } catch (cause) {
            throw new PipelineError(
                `Pipeline failed during encode stage: ${describe(cause)}`,
                "encode",
                { cause },
            );
        }

        // Stage 3 — Write. The writer re-encodes internally. We
        // let writer errors propagate untouched when they're a
        // SpectraError — they already carry useful context. Plain
        // Error / unknown values get wrapped in a PipelineError.
        let writeResult;
        try {
            writeResult = await this.writer.write(documentation, destination, {
                metadata: options?.metadata,
            });
        } catch (cause) {
            if (cause instanceof SpectraError) throw cause;
            throw new PipelineError(
                `Pipeline failed during write stage: ${describe(cause)}`,
                "write",
                { cause },
            );
        }

        return {
            destination: writeResult.destination,
            bytesWritten: writeResult.bytesWritten,
            bytes: writeResult.bytes,
            write: writeResult,
            elapsedMs: Date.now() - startedAt,
        };
    }
}

function describe(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}
