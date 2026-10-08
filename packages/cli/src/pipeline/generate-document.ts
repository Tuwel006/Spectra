import * as path from "node:path";

import { writeSpectraConfig } from "@spectra/core/encoding";
import { buildDocumentationBin } from "@spectra/provider-nestjs/pipeline";

import { copyBundledStudio } from "./rewrite-studio-paths.js";

/* ------------------------------------------------------------------ */
/* Public surface                                                      */
/* ------------------------------------------------------------------ */

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
    /** Where the bundled studio was copied to, if any. */
    readonly studioDestination?: string;
    /** Whether the studio was rebuilt with `basePath` set to `endpoint`. */
    readonly studioRebuilt?: boolean;
    /** Wall-clock time spent rebuilding the studio (ms). */
    readonly studioRebuildMs?: number;
}

export type EndpointSource =
    | "cli-explicit"
    | "cli-auto"
    | "config-existing"
    | "default";

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
    /**
     * `import.meta.url` of the caller, used to locate the bundled
     * studio relative to whichever file invoked this function (the
     * bundled `spectra.mjs` in production, the `.ts` source in dev).
     */
    readonly callerUrl: string;
}

/* ------------------------------------------------------------------ */
/* Implementation                                                      */
/* ------------------------------------------------------------------ */

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
            logger: silentLogger,
        },
    );

    // ---- Stage 2: config.json -----------------------------------------
    await writeSpectraConfig(args.projectRoot, { endpoint: args.endpoint });

    // ---- Stage 3: studio copy ----------------------------------------
    // The studio is a sibling of the bundled CLI binary. We try
    // several candidate paths to support both dev (running from
    // source via tsx) and prod (running from the bundled spectra.mjs).
    // A missing studio just means we skip the UI — the binary doc
    // still works without it.
    const studioCopy = copyBundledStudio(
        args.projectRoot,
        args.callerUrl,
        args.endpoint,
    );

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
        studioDestination: studioCopy.destination,
        studioRebuilt: studioCopy.rebuilt,
        studioRebuildMs: studioCopy.rebuildMs,
    };
}

const silentLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};
