import * as path from "node:path";

import type { Documentation } from "@spectra/core";
import {
    FileSystemSpectraWriter,
    MsgpackGzipEncoder,
    resolveSpectraBinPath,
    SpectraError,
    type IDocumentationEncoder,
    type IDocumentationWriter,
} from "@spectra/core/encoding";

import { DocumentationBuilder } from "../documentation/DocumentationBuilder";

import { PipelineError } from "./errors/PipelineError";
import type { IDocumentationBuilder } from "./interfaces/IDocumentationBuilder";
import type {
    IDocumentationPipeline,
    PipelineRunOptions,
    PipelineRunResult,
    PipelineScanStats,
    PipelineVerification,
} from "./interfaces/IDocumentationPipeline";

/**
 * Production pipeline: build → encode → write → (verify).
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
 *
 * <p>The optional verification stage reads the file back from disk
 * and decodes it, populating {@link PipelineRunResult.verification}.
 * This catches encoding/writer bugs at runtime that would otherwise
 * only show up when the studio tries to load the file later.</p>
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
        const shouldVerify = options?.verify ?? true;

        // Stage 1 — Build. The builder is synchronous today but we
        // keep the pipeline async to leave room for builders that
        // resolve type information lazily.
        let documentation: Documentation;
        try {
            documentation = this.builder.build();
        } catch (cause) {
            throw new PipelineError(
                `Pipeline failed during build stage: ${describe(cause)}`,
                "build",
                { cause },
            );
        }

        const stats = collectStats(documentation);

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

        // Stage 4 — Verify (optional). Reads the file back and
        // decodes it. Surfaces bugs in the encoder/writer pair that
        // would otherwise only manifest when the studio loads the
        // file later.
        let verification: PipelineVerification | undefined;
        if (shouldVerify) {
            const verifyStart = Date.now();
            try {
                const decoded = await this.writer.read(writeResult.destination);
                verification = {
                    ok: true,
                    decoded,
                    elapsedMs: Date.now() - verifyStart,
                };
            } catch (cause) {
                verification = {
                    ok: false,
                    error: describe(cause),
                    elapsedMs: Date.now() - verifyStart,
                };
            }
        }

        return {
            destination: writeResult.destination,
            bytesWritten: writeResult.bytesWritten,
            bytes: writeResult.bytes,
            write: writeResult,
            elapsedMs: Date.now() - startedAt,
            stats,
            verification,
            documentation,
        };
    }
}

/**
 * Walk a Documentation value object once and collect counts for every
 * section. Pure function — useful both inside the pipeline (to populate
 * {@link PipelineRunResult.stats}) and in standalone scripts that just
 * want a summary.
 */
export function collectStats(doc: Documentation): PipelineScanStats {
    let operationCount = 0;
    for (const p of Object.values(doc.paths)) {
        for (const op of Object.values(p.operations)) {
            if (op) operationCount++;
        }
    }
    return {
        pathCount: Object.keys(doc.paths).length,
        operationCount,
        schemaCount: Object.keys(doc.components.schemas).length,
        responseCount: Object.keys(doc.components.responses).length,
        parameterCount: Object.keys(doc.components.parameters).length,
        requestBodyCount: Object.keys(doc.components.requestBodies).length,
        headerCount: Object.keys(doc.components.headers).length,
        securitySchemeCount: Object.keys(doc.components.securitySchemes).length,
        tagCount: doc.tags.length,
        serverCount: doc.servers.length,
    };
}

function describe(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
}

/**
 * Convenience entry point used by the CLI script. Wraps the default
 * pipeline construction so scripts don't need to import the class
 * directly. Accepts an already-built pipeline (for testing) when one
 * is provided; falls back to a default-construction pipeline.
 */
export async function runDefaultPipeline(
    projectRoot: string,
    pipeline?: IDocumentationPipeline,
    options?: PipelineRunOptions,
): Promise<PipelineRunResult> {
    const p = pipeline ?? new SpectraBuildPipeline(projectRoot);
    return p.run(options);
}

/**
 * Pretty-print a pipeline result. Used by the CLI script and any
 * other consumer that wants a single-call summary.
 */
export function formatPipelineSummary(result: PipelineRunResult): string {
    const lines: string[] = [];
    lines.push(`Destination: ${result.destination}`);
    lines.push(`Bytes written: ${result.bytesWritten}`);
    lines.push(`Elapsed: ${result.elapsedMs} ms`);
    lines.push("");
    lines.push("Scan stats:");
    lines.push(`  paths:           ${result.stats.pathCount}`);
    lines.push(`  operations:      ${result.stats.operationCount}`);
    lines.push(`  schemas:         ${result.stats.schemaCount}`);
    lines.push(`  responses:       ${result.stats.responseCount}`);
    lines.push(`  parameters:      ${result.stats.parameterCount}`);
    lines.push(`  request bodies:  ${result.stats.requestBodyCount}`);
    lines.push(`  headers:         ${result.stats.headerCount}`);
    lines.push(`  security schemes: ${result.stats.securitySchemeCount}`);
    lines.push(`  tags:            ${result.stats.tagCount}`);
    lines.push(`  servers:         ${result.stats.serverCount}`);

    if (result.verification) {
        lines.push("");
        if (result.verification.ok) {
            lines.push(
                `Verification: OK (decoded in ${result.verification.elapsedMs} ms)`,
            );
        } else {
            lines.push(`Verification: FAILED — ${result.verification.error}`);
        }
    }

    return lines.join("\n");
}

// Re-export so the CLI script can construct a stable `path.dirname`
// for the destination without importing path itself.
export { path };
