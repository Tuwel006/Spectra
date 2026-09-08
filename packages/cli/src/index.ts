#!/usr/bin/env tsx
/**
 * `spectra` — the Spectra documentation CLI.
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
 *       {@link Documentation} value object.</li>
 *   <li><strong>Format</strong> — the pipeline hands the
 *       Documentation to an {@link IDocumentationEncoder}
 *       (default: msgpack + gzip + SPBC header).</li>
 *   <li><strong>Write</strong> — the encoded bytes land at
 *       <code>&lt;projectRoot&gt;/.spectra/document.bin</code>.</li>
 *   <li><strong>Verify</strong> — the pipeline reads the file back
 *       and decodes it to confirm the round-trip is clean.</li>
 *   <li><strong>Config</strong> — write the project's Spectra config
 *       (endpoint path, timestamp, schema version) to
 *       <code>&lt;projectRoot&gt;/.spectra/config.json</code>.</li>
 * </ol>
 *
 * <p>The CLI <strong>strictly uses the current working directory</strong>
 * as the project root — there is no positional argument. You must
 * <code>cd</code> into your NestJS project before running
 * <code>spectra</code>:</p>
 *
 * <pre>
 *   cd apps/example-api
 *   spectra                          # uses cwd
 *   spectra --endpoint /api-docs
 *   spectra --endpoint              # auto-generate from package name
 *   spectra --no-verify
 *   spectra --json &gt; report.json
 * </pre>
 */

import * as path from "node:path";
import { existsSync } from "node:fs";
import { stat } from "node:fs/promises";

import {
    formatPipelineSummary,
    buildDocumentationBin,
} from "@spectra/provider-nestjs";
import {
    resolveSpectraBinPath,
    writeSpectraConfig,
} from "@spectra/core/encoding";

import { resolveEndpoint, type ResolvedEndpoint } from "./endpoint";
import { Spinner, Box } from "./spinner";

interface CliArgs {
    readonly destination: string | undefined;
    readonly verify: boolean;
    readonly json: boolean;
    /** Explicit value when `--endpoint <value>` is provided. */
    readonly endpointExplicit: string | undefined;
    /** True when the user typed `--endpoint` without a value. */
    readonly endpointAuto: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
    let destination: string | undefined;
    let verify = true;
    let json = false;
    let endpointExplicit: string | undefined;
    let endpointAuto = false;

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
            case "--endpoint":
            case "-e": {
                // Look ahead — if the next token is a non-flag value,
                // consume it as the explicit endpoint. Otherwise treat
                // it as the "auto-generate" trigger.
                const next = argv[i + 1];
                if (next !== undefined && !next.startsWith("--")) {
                    endpointExplicit = next;
                    i++;
                } else {
                    endpointAuto = true;
                }
                break;
            }
            case "--help":
            case "-h":
                printUsage();
                process.exit(0);
            default:
                // Anything else is rejected — the CLI strictly uses
                // cwd and accepts no positional argument.
                throw new Error(
                    `Unknown argument: ${arg}\n` +
                        `The CLI strictly uses the current working directory as the project root.\n` +
                        `cd into your project and run \`spectra\` with no arguments.`,
                );
        }
    }

    return { destination, verify, json, endpointExplicit, endpointAuto };
}

function printUsage(): void {
    const lines = [
        "Usage: spectra [options]",
        "",
        "The CLI strictly uses the current working directory as the project root.",
        "cd into your NestJS project (the one with tsconfig.json) and run `spectra`.",
        "",
        "Options:",
        "  --no-verify             Skip the post-write decode-and-verify stage",
        "  --out <path>            Override the output destination",
        "  --endpoint <path>       Set the documentation endpoint path",
        "  --endpoint              Auto-generate the endpoint path from package.json",
        "  --json                  Emit the pipeline result as JSON",
        "  --help                  Print this message",
        "",
        "Default endpoint:                    /spectra",
        "",
        "Endpoint resolution order:",
        "  1. --endpoint <value>     explicit (used as-is)",
        "  2. --endpoint             auto-generate from package name",
        "  3. (no flag)              read from existing .spectra/config.json",
        "  4. (no config)            default /spectra",
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
            `Project root ${root} has no tsconfig.json — cannot build documentation.\n` +
                `cd into a NestJS project directory before running \`spectra\`.`,
        );
    }
}

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    // STRICT: project root is always the current working directory.
    // The CLI does not accept a positional argument — users must cd
    // into their NestJS project before invoking `spectra`.
    const projectRoot = process.cwd();

    validateProjectRoot(projectRoot);

    // Print the header FIRST so the log stream that follows flows in
    // chronological order.
    if (!args.json) {
        console.log("");
        console.log("  ╭───────────────────────────────────────────────╮");
        console.log("  │              SPECTRA  ·  CLI                  │");
        console.log("  │      Build, format, and persist API docs      │");
        console.log("  ╰───────────────────────────────────────────────╯");
        console.log("");
        console.log(`  project root    ${projectRoot}`);
        console.log(
            `  default output  ${resolveSpectraBinPath(projectRoot)}`,
        );
        console.log("");
    }

    // Resolve the endpoint that will end up in .spectra/config.json.
    const endpoint: ResolvedEndpoint = await resolveEndpoint({
        explicit: args.endpointExplicit,
        autoGenerate: args.endpointAuto,
        projectRoot,
    });

    if (!args.json) {
        const sourceLabel: Record<ResolvedEndpoint["source"], string> = {
            "cli-explicit": "from --endpoint flag",
            "cli-auto": "auto-generated from package.json",
            "config-existing": "from existing .spectra/config.json",
            default: "default /spectra",
        };
        console.log(`  endpoint        ${endpoint.endpoint}  (${sourceLabel[endpoint.source]})`);
        console.log("");
    }

    // ---- Run the pipeline --------------------------------------------
    const pipelineSpinner = new Spinner({ label: "pipeline" });
    pipelineSpinner.start(`Scanning ${projectRoot}…`);

    let result;
    try {
        result = await buildDocumentationBin(projectRoot, {
            destination: args.destination
                ? path.resolve(args.destination)
                : undefined,
            verify: args.verify,
            // Silent logger — the CLI does its own pretty output via
            // the Spinner + Box below. Setting a no-op logger keeps
            // the pipeline's built-in stage logs out of the way.
            logger: {
                info: () => undefined,
                warn: () => undefined,
                error: () => undefined,
            },
        });
        pipelineSpinner.succeed(
            `Pipeline finished in ${result.elapsedMs} ms — ${result.bytesWritten} bytes`,
        );
    } catch (err) {
        pipelineSpinner.fail(`Pipeline failed: ${(err as Error).message}`);
        process.exit(1);
    }

    // ---- Write config.json with the resolved endpoint ----------------
    const configSpinner = new Spinner({ label: "config" });
    configSpinner.start(`Writing .spectra/config.json (endpoint=${endpoint.endpoint})…`);
    try {
        await writeSpectraConfig(projectRoot, { endpoint: endpoint.endpoint });
        configSpinner.succeed(`Wrote endpoint ${endpoint.endpoint}`);
    } catch (err) {
        configSpinner.fail(`Failed to write config: ${(err as Error).message}`);
        process.exit(1);
    }

    // ---- Render the result -------------------------------------------
    if (args.json) {
        const safe = {
            projectRoot,
            destination: result.destination,
            bytesWritten: result.bytesWritten,
            elapsedMs: result.elapsedMs,
            stats: result.stats,
            endpoint: endpoint.endpoint,
            endpointSource: endpoint.source,
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

    // Summary box.
    const box = new Box("SPECTRA · BUILD REPORT", 68);
    box.addRow("scan", `Scanned ${projectRoot}`, "ok");
    box.addRow("build", `${result.stats.pathCount} paths · ${result.stats.operationCount} operations · ${result.stats.schemaCount} schemas`, "ok");
    box.addRow("format", `msgpack + gzip + SPBC header (${result.bytesWritten} bytes)`, "ok");
    box.addRow("write", result.destination, "ok");
    box.addRow(
        "verify",
        result.verification?.ok
            ? `round-trip OK (${result.verification.elapsedMs} ms)`
            : `round-trip FAILED: ${result.verification?.error ?? "unknown"}`,
        result.verification?.ok ? "ok" : "fail",
    );
    box.addRow("config", `endpoint ${endpoint.endpoint}`, "ok");
    box.render();

    console.log("");
    console.log(formatPipelineSummary(result));

    try {
        const fileStat = await stat(result.destination);
        console.log(`\n  on-disk size    ${fileStat.size} bytes`);
    } catch {
        /* stat failure is non-fatal */
    }

    if (result.verification && !result.verification.ok) {
        console.error(
            `\nVerification failed — the on-disk file did not round-trip cleanly: ${result.verification.error}`,
        );
        process.exit(2);
    }
}

main().catch((err) => {
    console.error(
        `\nspectra failed: ${(err as Error).message ?? String(err)}`,
    );
    process.exit(1);
});
