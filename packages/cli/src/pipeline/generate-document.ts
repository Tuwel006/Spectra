import * as path from "node:path";

import { writeSpectraConfig } from "@spectra/core/encoding";
import { buildDocumentationBin } from "@spectra/provider-nestjs/pipeline";

/* ------------------------------------------------------------------ */
/* Public surface                                                      */
/* ------------------------------------------------------------------ */

/**
 * CLI-local result type. Intentionally does NOT re-export any types
 * from `@spectra/provider-nestjs` — the CLI module doesn't need to
 * (and shouldn't) know the shape of the underlying pipeline result.
 *
 * The fields are picked out manually so this file stays the only
 * place in the CLI that touches provider-nestjs.
 */
export interface GenerateDocumentResult {
    readonly projectRoot: string;
    /** Final destination of the encoded .spectra/document.bin file. */
    readonly destination: string;
    /** Size of the file on disk in bytes. */
    readonly bytesWritten: number;
    /** Wall-clock duration of the build → encode → write cycle. */
    readonly elapsedMs: number;
    /** Scan stats (path / operation / schema counts). */
    readonly stats: {
        readonly pathCount: number;
        readonly operationCount: number;
        readonly schemaCount: number;
        readonly tagCount: number;
        readonly serverCount: number;
    };
    /** Endpoint path persisted to .spectra/config.json. */
    readonly endpoint: string;
    /** Provenance of the endpoint value (CLI / config / default). */
    readonly endpointSource: EndpointSource;
    /** Verification result — undefined when --no-verify was passed. */
    readonly verification:
        | {
              readonly ok: boolean;
              readonly elapsedMs: number;
              readonly error?: string;
          }
        | undefined;
}

/** Where the endpoint value came from in the resolution chain. */
export type EndpointSource =
    | "cli-explicit"
    | "cli-auto"
    | "config-existing"
    | "default";

/**
 * Caller-facing arguments for {@link generateDocument}.
 */
export interface GenerateDocumentArgs {
    readonly projectRoot: string;
    /** Endpoint path that should land in `.spectra/config.json`. */
    readonly endpoint: string;
    /** Provenance of the endpoint (forwarded to the reporter). */
    readonly endpointSource: EndpointSource;
    /** Optional override for the encoded file destination. */
    readonly destination?: string;
    /** Skip the post-write round-trip verify stage when false. */
    readonly verify: boolean;
}

/* ------------------------------------------------------------------ */
/* Implementation                                                      */
/* ------------------------------------------------------------------ */

/**
 * Run the full Spectra documentation pipeline for a project root:
 *
 * <ol>
 *   <li><strong>Build</strong> — walks the project root, parses
 *       NestJS controllers/routes/DTOs, produces a Documentation
 *       value object.</li>
 *   <li><strong>Format</strong> — msgpack + gzip + SPBC header.</li>
 *   <li><strong>Write</strong> — lands the encoded bytes at
 *       <code>&lt;projectRoot&gt;/.spectra/document.bin</code> (or at
 *       the optional override destination).</li>
 *   <li><strong>Config</strong> — additionally writes
 *       <code>&lt;projectRoot&gt;/.spectra/config.json</code> with the
 *       resolved endpoint so the runtime / studio can mount on the
 *       right HTTP path later.</li>
 * </ol>
 *
 * <p>This is the only function in the CLI package that should call
 * the underlying pipeline directly. Every CLI command delegates to
 * {@link generateDocument} so the (build → format → write → config)
 * sequence stays atomic and the result stays in one shape.</p>
 */
export async function generateDocument(
    args: GenerateDocumentArgs,
): Promise<GenerateDocumentResult> {
    // ---- Stage 1: build → format → write -----------------------------
    const pipelineResult = await buildDocumentationBin(
        args.projectRoot,
        {
            destination: args.destination
                ? path.resolve(args.destination)
                : undefined,
            verify: args.verify,
            // The CLI owns all user-visible output (spinner + box) so we
            // silence the pipeline's built-in stage logs to keep the
            // two layers from double-printing.
            logger: silentLogger,
        },
    );

    // ---- Stage 2: config.json -----------------------------------------
    // Write the resolved endpoint alongside the encoded document so
    // the runtime / studio can pick it up later. Failure here fails
    // the whole `generate` operation — the config and the doc
    // always land together.
    await writeSpectraConfig(args.projectRoot, { endpoint: args.endpoint });

    // ---- Stage 3: project the result into a CLI-shaped value ----------
    // Pick the fields the CLI cares about into a local type so the
    // rest of the CLI never has to import anything from
    // `@spectra/provider-nestjs`.
    return {
        projectRoot: args.projectRoot,
        destination: pipelineResult.destination,
        bytesWritten: pipelineResult.bytesWritten,
        elapsedMs: pipelineResult.elapsedMs,
        stats: {
            pathCount: pipelineResult.stats.pathCount,
            operationCount: pipelineResult.stats.operationCount,
            schemaCount: pipelineResult.stats.schemaCount,
            tagCount: pipelineResult.stats.tagCount,
            serverCount: pipelineResult.stats.serverCount,
        },
        endpoint: args.endpoint,
        endpointSource: args.endpointSource,
        verification: pipelineResult.verification
            ? {
                  ok: pipelineResult.verification.ok,
                  elapsedMs: pipelineResult.verification.elapsedMs,
                  error: pipelineResult.verification.error,
              }
            : undefined,
    };
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * No-op logger so the underlying pipeline doesn't emit its own
 * stage-prefixed lines — the CLI is responsible for all output via
 * {@link Spinner} + {@link Box}.
 */
const silentLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};
