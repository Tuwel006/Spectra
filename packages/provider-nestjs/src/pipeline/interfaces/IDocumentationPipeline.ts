import type {
    DocumentationDestination,
    WriteResult,
} from "@spectra/core";

/**
 * Optional per-run overrides for the pipeline.
 *
 * <p>Each field is independent — callers can pass just the destination
 * to override the file path, or just `clean` to skip the write step,
 * etc. Fields left undefined fall back to the pipeline's defaults
 * (which themselves come from the injected encoder/writer).</p>
 */
export interface PipelineRunOptions {
    /** Override the destination — usually a directory or file path. */
    readonly destination?: DocumentationDestination;
    /** Free-form metadata attached to the encoded payload (logs only). */
    readonly metadata?: Record<string, string | number | boolean>;
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
