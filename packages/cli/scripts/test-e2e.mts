/**
 * End-to-end smoke test for the Spectra documentation pipeline.
 *
 * <p>Drives the same three collaborators the published `spectra generate`
 * command uses, but in a single TypeScript entry point so you can
 * validate the full chain on an un‑published checkout — no npm
 * install required, no separate CLI binary needed.</p>
 *
 * <p>What it does, in order:</p>
 * <ol>
 *   <li>Calls <code>buildDocumentationBin(projectRoot)</code> from
 *       <code>@spectra/provider-nestjs</code> — the same function
 *       that ships in <code>dist/spectra.mjs</code>. This scans the
 *       NestJS source under <code>projectRoot</code>, encodes the
 *       result with msgpack + gzip + the SPBC magic header, and
 *       writes the file to <code>projectRoot/.spectra/document.bin</code>.</li>
 *   <li>Calls <code>writeSpectraConfig(projectRoot, { endpoint })</code>
 *       from <code>@spectra/core/encoding</code> to drop the
 *       <code>.spectra/config.json</code> next to the bin.</li>
 *   <li>Calls <code>copyBundledStudio(projectRoot, import.meta.url)</code>
 *       to mirror the studio static export from
 *       <code>apps/studio/out</code> into
 *       <code>projectRoot/.spectra/studio</code>.</li>
 *   <li>Reads the resulting files back, prints a pass/fail report
 *       and exits non‑zero on any failure.</li>
 * </ol>
 *
 * <p>Run with: <code>pnpm test:spectra:e2e</code> (defined in the
 * root <code>package.json</code>).</p>
 */

import { existsSync, statSync, readFileSync, readdirSync } from "node:fs";
import { mkdirSync, rmSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { buildDocumentationBin } from "@spectra/provider-nestjs/pipeline";
import {
    readSpectraConfig,
    writeSpectraConfig,
    resolveSpectraBinPath,
    SPECTRA_DEFAULT_ENDPOINT,
} from "@spectra/core/encoding";

import { copyBundledStudio } from "../src/pipeline/rewrite-studio-paths.js";

/* ------------------------------------------------------------------ */
/* CLI argument parsing (mirrors `spectra generate --endpoint`)        */
/* ------------------------------------------------------------------ */

interface CliArgs {
    readonly projectRoot: string;
    readonly endpoint: string;
    readonly verify: boolean;
    readonly noClean: boolean;
}

function parseArgs(argv: readonly string[]): CliArgs {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const repoRoot = path.resolve(here, "..", "..", "..");
    let projectRoot = path.join(repoRoot, "apps", "example-api");
    let endpoint = SPECTRA_DEFAULT_ENDPOINT;
    let verify = true;
    let noClean = false;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]!;
        switch (arg) {
            case "--project":
            case "-p": {
                const v = argv[++i];
                if (!v) throw new Error("--project requires a path");
                projectRoot = path.resolve(v);
                break;
            }
            case "--endpoint":
            case "-e": {
                const v = argv[++i];
                if (!v) throw new Error("--endpoint requires a path");
                endpoint = v.startsWith("/") ? v : `/${v}`;
                break;
            }
            case "--no-verify":
                verify = false;
                break;
            case "--no-clean":
                noClean = true;
                break;
            case "--help":
            case "-h":
                printHelp();
                process.exit(0);
        }
    }

    return { projectRoot, endpoint, verify, noClean };
}

function printHelp(): void {
    console.log(`
test-spectra-e2e — drive the full Spectra generation chain in-process

Usage:
  tsx scripts/test-spectra-e2e.ts [options]

Options:
  --project <path>   NestJS project to scan            [default: apps/example-api]
  --endpoint <path>  Mount path written to config.json [default: /spectra]
  --no-verify        Skip the round-trip decode check
  --no-clean         Keep any pre-existing .spectra/ before generating
  -h, --help         Print this help

What it does:
  1. buildDocumentationBin(<project>)  → .spectra/document.bin
  2. writeSpectraConfig(<project>, { endpoint })
                                       → .spectra/config.json
  3. copies apps/studio/out/           → .spectra/studio/
  4. round-trip verifies the bin       (unless --no-verify)
  5. prints a pass/fail report and exits non-zero on failure
`);
}

/* ------------------------------------------------------------------ */
/* Report helpers                                                      */
/* ------------------------------------------------------------------ */

interface CheckResult {
    readonly name: string;
    readonly ok: boolean;
    readonly detail: string;
}

const checks: CheckResult[] = [];
function check(name: string, ok: boolean, detail = ""): void {
    checks.push({ name, ok, detail });
    const tag = ok ? "✓ PASS" : "✗ FAIL";
    const line = `  ${tag}  ${name}${detail ? ` — ${detail}` : ""}`;
    console.log(line);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));
    const spectraDir = path.join(args.projectRoot, ".spectra");
    const binPath = resolveSpectraBinPath(args.projectRoot);
    const configPath = path.join(spectraDir, "config.json");
    const studioDir = path.join(spectraDir, "studio");

    console.log("");
    console.log("  SPECTRA · E2E SMOKE");
    console.log("");
    console.log(`  project root  ${args.projectRoot}`);
    console.log(`  bin path      ${binPath}`);
    console.log(`  config path   ${configPath}`);
    console.log(`  studio path   ${studioDir}`);
    console.log(`  endpoint      ${args.endpoint}`);
    console.log(`  verify        ${args.verify}`);
    console.log("");

    /* ---- Pre-flight ----------------------------------------------- */
    if (!existsSync(args.projectRoot)) {
        console.error(`Project root does not exist: ${args.projectRoot}`);
        process.exit(2);
    }
    if (!existsSync(path.join(args.projectRoot, "package.json"))) {
        console.error(`No package.json at ${args.projectRoot} — is this a NestJS project?`);
        process.exit(2);
    }

    /* ---- Clean state (optional) ---------------------------------- */
    if (!args.noClean && existsSync(spectraDir)) {
        rmSync(spectraDir, { recursive: true, force: true });
        console.log("  · cleaned pre-existing .spectra/");
    }
    mkdirSync(spectraDir, { recursive: true });

    /* ---- Stage 1: build + encode + write ------------------------- */
    console.log("\n  [stage 1] buildDocumentationBin → document.bin");
    const t0 = Date.now();
    let binResult: Awaited<ReturnType<typeof buildDocumentationBin>>;
    try {
        binResult = await buildDocumentationBin(args.projectRoot, {
            verify: args.verify,
            logger: {
                info: (stage, msg) => console.log(`    [${stage}] ${msg}`),
                warn: (stage, msg) => console.log(`    [${stage} !] ${msg}`),
                error: (stage, msg) => console.log(`    [${stage} !!] ${msg}`),
            },
        });
    } catch (e) {
        check("buildDocumentationBin", false, e instanceof Error ? e.message : String(e));
        printReport();
        process.exit(1);
    }
    const buildMs = Date.now() - t0;
    check(
        "buildDocumentationBin",
        existsSync(binPath),
        `${binResult.bytesWritten} bytes in ${binResult.elapsedMs}ms (call ${buildMs}ms)`,
    );

    /* ---- Stage 2: write config.json ------------------------------- */
    console.log("\n  [stage 2] writeSpectraConfig → config.json");
    try {
        await writeSpectraConfig(args.projectRoot, {
            endpoint: args.endpoint,
        });
        const readBack = await readSpectraConfig(args.projectRoot);
        check(
            "writeSpectraConfig",
            readBack?.endpoint === args.endpoint,
            `endpoint=${readBack?.endpoint}, schemaVersion=${readBack?.schemaVersion}`,
        );
    } catch (e) {
        check("writeSpectraConfig", false, e instanceof Error ? e.message : String(e));
    }

    /* ---- Stage 3: copy studio ------------------------------------- */
    console.log("\n  [stage 3] copyBundledStudio → .spectra/studio/");
    try {
        const result = copyBundledStudio(
            args.projectRoot,
            import.meta.url,
            args.endpoint,
        );
        if (!result.copied) {
            check("copyBundledStudio", false, "no studio build found (run `pnpm --filter studio build` first)");
        } else {
            const indexExists = existsSync(path.join(studioDir, "index.html"));
            const fileCount = countFiles(studioDir);
            const rebuildNote = result.rebuilt
                ? ` (studio rebuilt with basePath=${args.endpoint} in ${result.rebuildMs}ms)`
                : "";
            check(
                "copyBundledStudio",
                indexExists,
                `${fileCount} files copied, ${result.rewritten} HTML file(s) rewritten${rebuildNote}`,
            );
        }
    } catch (e) {
        check("copyBundledStudio", false, e instanceof Error ? e.message : String(e));
    }

    /* ---- Stage 4: verify the bin (already done inside stage 1) --- */
    if (args.verify) {
        check(
            "round-trip verify",
            binResult.verification?.ok === true,
            binResult.verification?.error ?? "ok",
        );
    }

    /* ---- Stage 5: inspect bytes on disk -------------------------- */
    console.log("\n  [stage 4] file-system inspection");
    check(".spectra/document.bin exists", existsSync(binPath), sizeStr(binPath));
    check(".spectra/config.json exists", existsSync(configPath), sizeStr(configPath));
    check(".spectra/studio/ exists", existsSync(studioDir), existsSync(studioDir) ? `${countFiles(studioDir)} files` : "");
    const magic = readFirstBytes(binPath, 4);
    const magicOk = magic && magic[0] === 0x53 && magic[1] === 0x50 && magic[2] === 0x42 && magic[3] === 0x43;
    check("document.bin magic header is 'SPBC'", magicOk, magic ? `bytes=${[...magic].map((b) => b.toString(16).padStart(2, "0")).join(" ")}` : "unreadable");

    if (existsSync(configPath)) {
        const cfg = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
        check(
            "config.json is well-formed",
            typeof cfg.endpoint === "string" && cfg.schemaVersion === 1,
            `endpoint=${cfg.endpoint}, schemaVersion=${cfg.schemaVersion}`,
        );
    }

    printReport(binResult);
}

function printReport(binResult?: Awaited<ReturnType<typeof buildDocumentationBin>>): void {
    const passed = checks.filter((c) => c.ok).length;
    const failed = checks.length - passed;
    console.log("\n  ────────────── REPORT ──────────────");
    if (binResult) {
        console.log(`  paths      : ${binResult.stats.pathCount}`);
        console.log(`  operations : ${binResult.stats.operationCount}`);
        console.log(`  schemas    : ${binResult.stats.schemaCount}`);
        console.log(`  tags       : ${binResult.stats.tagCount}`);
        console.log(`  servers    : ${binResult.stats.serverCount}`);
        console.log(`  bytes      : ${binResult.bytesWritten}`);
        console.log(`  elapsed    : ${binResult.elapsedMs}ms`);
        console.log(`  verified   : ${binResult.verification?.ok ?? "(skipped)"}`);
    }
    console.log("  ────────────────────────────────────");
    console.log(`  checks     : ${passed} passed, ${failed} failed`);
    console.log("  ────────────────────────────────────");

    if (failed > 0) {
        console.error(`\n  RESULT: FAIL — ${failed} check(s) failed.\n`);
        process.exit(1);
    } else {
        console.log(`\n  RESULT: OK — .spectra/ is ready.\n`);
    }
}

function sizeStr(p: string): string {
    if (!existsSync(p)) return "missing";
    const s = statSync(p);
    return `${s.size} bytes`;
}

function countFiles(p: string): number {
    if (!existsSync(p)) return 0;
    let n = 0;
    const stack: string[] = [p];
    while (stack.length) {
        const cur = stack.pop()!;
        const s = statSync(cur);
        if (s.isDirectory()) {
            for (const entry of readdirSync(cur)) stack.push(path.join(cur, entry));
        } else {
            n++;
        }
    }
    return n;
}

function readFirstBytes(p: string, n: number): Uint8Array | undefined {
    try {
        const fd = readFileSync(p);
        return new Uint8Array(fd.buffer, fd.byteOffset, Math.min(n, fd.byteLength));
    } catch {
        return undefined;
    }
}

main().catch((e) => {
    console.error("Spectra E2E crashed:", e);
    process.exit(1);
});
