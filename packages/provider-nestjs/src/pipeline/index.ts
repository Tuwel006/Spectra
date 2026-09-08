/* ------------------------------------------------------------------ */
/* Interfaces                                                          */
/* ------------------------------------------------------------------ */

export type {
    IDocumentationBuilder,
} from "./interfaces/IDocumentationBuilder";

export type {
    IDocumentationPipeline,
    PipelineRunOptions,
    PipelineRunResult,
    PipelineScanStats,
    PipelineVerification,
} from "./interfaces/IDocumentationPipeline";

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export {
    PipelineError,
    type PipelineStage,
} from "./errors/PipelineError";

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export {
    SpectraBuildPipeline,
    collectStats,
    runDefaultPipeline,
    formatPipelineSummary,
} from "./SpectraBuildPipeline";
