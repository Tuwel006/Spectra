/**
 * Pipeline stage identifier — included in every {@link PipelineError}
 * so callers can pinpoint which collaborator failed.
 */
export type PipelineStage = "build" | "encode" | "write";

/**
 * Base class for errors thrown by {@link SpectraBuildPipeline}.
 *
 * <p>Wrapping collaborator errors in a single typed exception lets
 * pipeline consumers (CLI scripts, build runners, the studio's
 * server-side renderer) catch with one block and decide how to
 * surface the failure — log, retry, or abort.</p>
 */
export class PipelineError extends Error {
    public readonly stage: PipelineStage;

    public constructor(
        message: string,
        stage: PipelineStage,
        options?: { readonly cause?: unknown },
    ) {
        super(message, options);
        this.name = "PipelineError";
        this.stage = stage;
    }
}
