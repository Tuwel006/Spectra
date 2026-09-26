import type { Documentation } from "@spectra/core";
import type {
    DocumentationDestination,
    WriteResult,
} from "@spectra/core/encoding";

import type { PipelineLogger } from "../logging/PipelineLogger";

/**
 * High-level counts the pipeline collects while building. Surfaced
 * alongside the write result so CLI / build-runner consumers can
 * summarise what got extracted without re-walking the Documentation
 * object themselves.
 */
export interface PipelineScanStats {
    /** Number of paths in the resulting Documentation (e.g. `/users/{id}`). */
    readonly pathCount: number;
    /** Total operations across all paths. */
    readonly operationCount: number;
    /** Number of components.schemas. */
    readonly schemaCount: number;
    /** Number of components.responses. */
    readonly responseCount: number;
    /** Number of components.parameters. */
    readonly parameterCount: number;
    /** Number of components.requestBodies. */
    readonly requestBodyCount: number;
    /** Number of components.headers. */
    readonly headerCount: number;
    /** Number of components.securitySchemes. */
    readonly securitySchemeCount: number;
    /** Number of tags. */
    readonly tagCount: number;
    /** Number of servers. */
    readonly serverCount: number;
}

/**
 * Outcome of the optional post-write verification stage. The pipeline
 * reads the file back and decodes it; if the round-trip succeeds,
 * `decoded` is set and the caller can diff it against the original
 * Documentation object.
 */
export interface PipelineVerification {
    /** True when the on-disk file decoded successfully. */
    readonly ok: boolean;
    /** Error message when verification failed. */
    readonly error?: string;
    /** Decoded Documentation (set when `ok === true`). */
    readonly decoded?: Documentation;
    /** Wall-clock duration of the verify stage in milliseconds. */
    readonly elapsedMs: number;
}

/**
 * Optional per-run overrides for the pipeline.
 *
 * <p>Each field is independent — callers can pass just the destination
 * to override the file path, or just `verify: true` to round-trip
 * check the output, etc. Fields left undefined fall back to the
 * pipeline's defaults (which themselves come from the injected
 * encoder/writer).</p>
 */
export interface PipelineRunOptions {
    /** Override the destination — usually a directory or file path. */
    readonly destination?: DocumentationDestination;
    /** Free-form metadata attached to the encoded payload (logs only). */
    readonly metadata?: Record<string, string | number | boolean>;
    /**
     * When true, the pipeline reads the file back from disk after the
     * write stage and decodes it, returning the result in
     * {@link PipelineRunResult.verification}. Defaults to `true` for
     * CLI runs; tests that only care about the write can opt out.
     */
    readonly verify?: boolean;
    /**
     * Logger that the pipeline emits stage transitions to. When
     * omitted, the pipeline uses {@link consoleLogger} so a CLI
     * invocation produces a readable log stream by default. Tests
     * should pass {@link silentLogger} to keep their assertion
     * output clean.
     */
    readonly logger?: PipelineLogger;
}

/**
 * Result of one pipeline run. The pipeline is the only place that
 * sees the full picture (builder + encoder + writer), so this is
 * the right place to consolidate the artifacts a caller might want
 * back.
 */
export interface PipelineRunResult {
    /** The destination that was written (absolute path, S3 URL, etc). */
    readonly destination: DocumentationDestination;
    /** Number of bytes written to the destination. */
    readonly bytesWritten: number;
    /** The encoded bytes — exposed for streaming / upload consumers. */
    readonly bytes: Uint8Array;
    /** The encoded bytes, also re-exported as a {@link WriteResult}. */
    readonly write: WriteResult;
    /** Wall-clock duration of the pipeline run, in milliseconds. */
    readonly elapsedMs: number;
    /** Counts collected during the build stage. */
    readonly stats: PipelineScanStats;
    /** Verification result — set when `options.verify` was truthy. */
    readonly verification?: PipelineVerification;
    /** The in-memory Documentation that was encoded. */
    readonly documentation: Documentation;
}

/**
 * Single Responsibility: orchestrate a build → encode → write cycle
 * for a Documentation.
 *
 * <p>The pipeline owns no business logic itself — it composes three
 * collaborators, each of which has a single, narrow job:</p>
 *
 * <ul>
 *   <li>{@link IDocumentationBuilder} — produces a Documentation
 *       value object from project sources.</li>
 *   <li>{@link IDocumentationEncoder} — turns that value object into
 *       opaque bytes.</li>
 *   <li>{@link IDocumentationWriter} — persists those bytes to a
 *       destination.</li>
 * </ul>
 *
 * <p>The pipeline depends on these three <em>interfaces</em>, never
 * on concrete implementations — that's the Dependency Inversion
 * Principle at work. A different builder, encoder, or writer can be
 * injected at construction time without modifying this class.</p>
 */
export interface IDocumentationPipeline {
    /**
     * Run the full pipeline against the project root this pipeline
     * was configured with.
     *
     * @throws {@link PipelineError} (or one of its typed subclasses)
     *   when any stage fails. The pipeline wraps collaborator errors
     *   so callers can react with one catch block.
     */
    run(options?: PipelineRunOptions): Promise<PipelineRunResult>;
}
