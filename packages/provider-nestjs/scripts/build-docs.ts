#!/usr/bin/env tsx
/**
 * Full Spectra documentation integration script.
 *
 * <p>This is the single entry point that drives the entire pipeline
 * end-to-end:</p>
 *
 * <ol>
 *   <li><strong>Scan</strong> — the project root is walked by the
 *       {@link DocumentationBuilder}, which inspects `tsconfig.json`,
 *       `package.json`, `.env*`, and every TypeScript source file
 *       for NestJS controller / route / DTO declarations.</li>
 *   <li><strong>Build</strong> — the builder produces a fully-formed
 *       {@link Documentation} value object with all
 *       info / servers / tags / components / paths populated.</li>
 *   <li><strong>Format</strong> — the {@link SpectraBuildPipeline}
 *       hands the Documentation to an
 *       {@link IDocumentationEncoder} (the default
 *       {@link MsgpackGzipEncoder} msgpack + gzips it and prepends
 *       the SPBC magic header).</li>
 *   <li><strong>Write</strong> — the encoded bytes are handed to an
 *       {@link IDocumentationWriter} (the default
 *       {@link FileSystemSpectraWriter}) which lands them at
 *       <code>&lt;projectRoot&gt;/.spectra/document.bin</code>.</li>
 *   <li><strong>Verify</strong> — the pipeline reads the file back,
 *       decodes it, and reports whether the round-trip preserved
 *       every field.</li>
 * </ol>
 *
 * <p>Usage:</p>
 *
 * <pre>
 *   tsx packages/provider-nestjs/scripts/build-docs.ts &lt;project-root&gt;
 *   tsx packages/provider-nestjs/scripts/build-docs.ts apps/example-api
 *   tsx packages/provider-nestjs/scripts/build-docs.ts --no-verify apps/example-api
 *   tsx packages/provider-nestjs/scripts/build-docs.ts --out /tmp/foo.bin apps/example-api
 * </pre>
 *
 * <p>The script wires the pipeline through the
 * {@link IDocumentationPipeline} interface — never the concrete
 * class — so swapping encoders or writers only requires editing this
 * file's constructor wiring, not its orchestration logic.</p>
 */

import * as path from "node:path";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";

import {
    FileSystemSpectraWriter,
    MsgpackGzipEncoder,
    resolveSpectraBinPath,
} from "@spectra/core/encoding";

import {
    SpectraBuildPipeline,
    formatPipelineSummary,
    type IDocumentationPipeline,
} from "../src/pipeline";

interface CliArgs {
    readonly projectRoot: string;
    readonly destination: string | undefined;
    readonly verify: boolean;
    readonly json: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
    let projectRoot: string | undefined;
    let destination: string | undefined;
    let verify = true;
    let json = false;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]!;
        switch (arg) {
            case "--no-verify":
                verify = false;
                break;
            case "--json":
                json = true;
                break;
            case "--out":
            case "-o": {
                const next = argv[i + 1];
                if (!next) {
                    throw new Error(`--out requires a destination argument`);
                }
                destination = path.resolve(next);
                i++;
                break;
            }
            case "--help":
            case "-h":
                printUsage();
                process.exit(0);
            default:
                if (arg.startsWith("--")) {
                    throw new Error(`Unknown flag: ${arg}`);
                }
                if (projectRoot !== undefined) {
                    throw new Error(`Multiple project roots provided: ${projectRoot} and ${arg}`);
                }
                projectRoot = path.resolve(arg);
        }
    }

    if (projectRoot === undefined) {
        // Default to the bundled example API so the script is
        // runnable with no arguments during local development.
        const here = path.dirname(new URL(import.meta.url).pathname);
        projectRoot = path.resolve(here, "..", "..", "..", "apps", "example-api");
    }

    return { projectRoot, destination, verify, json };
}

function printUsage(): void {
    const lines = [
        "Usage: tsx build-docs.ts [options] <project-root>",
        "",
        "Options:",
        "  --no-verify     Skip the post-write decode-and-verify stage",
        "  --out <path>    Override the output destination",
        "  --json          Emit the pipeline result as JSON (for piping)",
        "  --help          Print this message",
        "",
        "Default project root when omitted: apps/example-api",
    ];
    console.log(lines.join("\n"));
}

function validateProjectRoot(root: string): void {
    if (!existsSync(root)) {
        throw new Error(`Project root does not exist: ${root}`);
    }
    const tsconfig = path.join(root, "tsconfig.json");
    if (!existsSync(tsconfig)) {
        throw new Error(
            `Project root ${root} has no tsconfig.json — cannot build documentation`,
        );
    }
}

/**
 * Construct the production pipeline. Wired through interfaces so
 * that swapping the encoder or writer is a one-line change here.
 */
function buildDefaultPipeline(projectRoot: string): IDocumentationPipeline {
    const encoder = new MsgpackGzipEncoder();
    const writer = new FileSystemSpectraWriter(encoder);
    return new SpectraBuildPipeline(projectRoot, { encoder, writer });
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    validateProjectRoot(args.projectRoot);

    const pipeline = buildDefaultPipeline(args.projectRoot);
    const result = await pipeline.run({
        destination: args.destination
            ? path.resolve(args.destination)
            : undefined,
        verify: args.verify,
    });

    if (args.json) {
        // Strip non-JSON-safe fields (Uint8Array, Documentation
        // object) before serialising.
        const safe = {
            destination: result.destination,
            bytesWritten: result.bytesWritten,
            elapsedMs: result.elapsedMs,
            stats: result.stats,
            verification: result.verification
                ? {
                      ok: result.verification.ok,
                      error: result.verification.error,
                      elapsedMs: result.verification.elapsedMs,
                  }
                : undefined,
        };
        console.log(JSON.stringify(safe, null, 2));
        return;
    }

    console.log("===== SPECTRA — FULL DOCUMENT INTEGRATION =====\n");
    console.log(`Project root:  ${args.projectRoot}`);
    console.log(
        `Default path:  ${resolveSpectraBinPath(args.projectRoot)}`,
    );

    // Surface the file size on disk so the user can confirm the
    // opaque payload landed correctly.
    try {
        const fileStat = await stat(result.destination);
        console.log(`On-disk size:  ${fileStat.size} bytes`);
    } catch {
        /* stat failure is non-fatal — we already have bytesWritten */
    }

    console.log("");
    console.log(formatPipelineSummary(result));

    if (result.verification && !result.verification.ok) {
        console.error(
            `\nVerification failed — the on-disk file did not round-trip cleanly: ${result.verification.error}`,
        );
        process.exit(2);
    }
}

main().catch((err) => {
    console.error(
        `\nbuild-docs failed: ${(err as Error).message ?? String(err)}`,
    );
    process.exit(1);
});
