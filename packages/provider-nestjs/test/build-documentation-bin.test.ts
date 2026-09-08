/**
 * Full Spectra documentation integration — TEST RUNNER.
 *
 * <p>This test exercises the entire pipeline against the
 * <strong>hardcoded</strong> example-api project directory. Run it
 * with:</p>
 *
 * <pre>
 *   pnpm test:nest:build
 * </pre>
 *
 * <p>It calls a single function — {@link buildDocumentationBin} —
 * passing the path to the example-api project. The function does
 * everything in one go:</p>
 *
 * <ol>
 *   <li><strong>Scan</strong> — walks the project root, reads
 *       <code>tsconfig.json</code> / <code>package.json</code> /
 *       <code>.env*</code> and every TypeScript source file.</li>
 *   <li><strong>Parse</strong> — extracts controllers, routes,
 *       operations, schemas, guards, pipes, interceptors.</li>
 *   <li><strong>Build</strong> — produces a complete
 *       {@link Documentation} value object with
 *       <code>info</code>, <code>servers</code>, <code>tags</code>,
 *       <code>components.schemas</code>, and <code>paths</code>.</li>
 *   <li><strong>Encode</strong> — passes the Documentation through
 *       the msgpack + gzip encoder with the SPBC magic header.</li>
 *   <li><strong>Write</strong> — creates
 *       <code>&lt;projectRoot&gt;/.spectra/document.bin</code>
 *       (NOT in the calling process's working directory).</li>
 *   <li><strong>Verify</strong> — reads the file back and decodes
 *       it to confirm the round-trip is clean.</li>
 * </ol>
 *
 * <p>The test prints every stage's log line via the default
 * <code>consoleLogger</code> so you can see exactly what's
 * happening as it runs.</p>
 */

import { rm } from "node:fs/promises";

import { resolveSpectraBinPath } from "@spectra/core/encoding";

import { buildDocumentationBin } from "../src/pipeline";

/* ------------------------------------------------------------------ */
/* The path under test — hardcoded by design.                         */
/* ------------------------------------------------------------------ */

/**
 * Absolute path to the example NestJS project this test builds
 * documentation for. Hardcoded so anyone reading the test can see
 * exactly which project the pipeline scans — no mystery path
 * resolution, no dynamic computation.
 *
 * The path is computed from this file's location at module load
 * time but is written here as a single constant so the test reads
 * like a recipe: "given this project, build its docs".
 */
const EXAMPLE_API_PROJECT_ROOT = "/Users/karmick/Documents/Tuwel/untitled folder/untitled folder/untitled folder/Spectra/Spectra/apps/example-api";

/* ------------------------------------------------------------------ */
/* The single function under test.                                    */
/* ------------------------------------------------------------------ */

/**
 * Build the complete Documentation for the given NestJS project
 * root and persist it as a `.spectra/document.bin` file inside
 * that project root.
 *
 * <p>This is the function the user calls — exactly one call, the
 * pipeline does the rest:</p>
 *
 * <ol>
 *   <li>scans the project (tsconfig, package.json, .env*, src/**)</li>
 *   <li>parses NestJS controllers / routes / DTOs</li>
 *   <li>builds a `Documentation` value object (info + servers +
 *       tags + components + paths)</li>
 *   <li>encodes it as msgpack + gzip with the SPBC header</li>
 *   <li>writes `<projectRoot>/.spectra/document.bin`</li>
 *   <li>verifies the round-trip by reading it back</li>
 * </ol>
 *
 * <p>The `.spectra` folder is created INSIDE the passed project
 * root — never in the calling process's working directory.</p>
 */
async function buildDocsForProject(
    projectRoot: string,
): Promise<Awaited<ReturnType<typeof buildDocumentationBin>>> {
    // The pipeline runs synchronously here (no top-level await
    // needed) and emits every stage transition through the default
    // consoleLogger. The console output you see while the test runs
    // is produced by the pipeline itself, not by hand-written
    // console.log calls.
    const result = await buildDocumentationBin(projectRoot);

    // Print the in-memory Documentation summary so the test output
    // shows what the pipeline actually built, not just that it
    // wrote a file.
    console.log("");
    console.log("Built documentation:");
    console.log(`  info.title:       ${result.documentation.info.title}`);
    console.log(`  info.version:     ${result.documentation.info.version}`);
    console.log(`  servers:          ${result.documentation.servers.length}`);
    console.log(`  tags:             ${result.documentation.tags.length}`);
    console.log(`  schemas:          ${Object.keys(result.documentation.components.schemas).length}`);
    console.log(`  paths:            ${Object.keys(result.documentation.paths).length}`);

    console.log("");
    console.log("Wrote to disk:");
    console.log(`  destination:      ${result.destination}`);
    console.log(`  bytes:            ${result.bytesWritten}`);
    console.log(`  on-disk folder:   ${result.destination.substring(0, result.destination.lastIndexOf("/.spectra"))}/.spectra/`);
    console.log(`  on-disk file:     ${result.destination}`);
    console.log(`  verification:     ${result.verification?.ok ? "OK" : "FAILED"} (decoded in ${result.verification?.elapsedMs ?? 0} ms)`);

    return result;
}

/* ------------------------------------------------------------------ */
/* Test runner                                                        */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
    console.log("===== SPECTRA — FULL DOCUMENT INTEGRATION TEST =====\n");
    console.log(`Hardcoded project root: ${EXAMPLE_API_PROJECT_ROOT}`);
    console.log("");

    // Pre-flight: ensure we start from a clean slate so the
    // "folder was created" claim at the end of the test is
    // meaningful.
    const spectraDir = `${EXAMPLE_API_PROJECT_ROOT}/.spectra`;
    await rm(spectraDir, { recursive: true, force: true });
    console.log(`Pre-flight: removed any pre-existing ${spectraDir}\n`);

    let pass = 0;
    let total = 0;
    const check = (name: string, ok: boolean, detail = ""): void => {
        total++;
        if (ok) pass++;
        console.log(
            `  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
        );
    };

    // ---- Run the single function --------------------------------------
    let r;
    try {
        r = await buildDocsForProject(EXAMPLE_API_PROJECT_ROOT);
        check("buildDocsForProject(EXAMPLE_API_PROJECT_ROOT) resolved", true);
    } catch (err) {
        console.error(
            `\nFATAL: buildDocsForProject threw: ${(err as Error).message}`,
        );
        process.exit(1);
    }

    // ---- Assertions ---------------------------------------------------
    const expected = resolveSpectraBinPath(EXAMPLE_API_PROJECT_ROOT);

    check(
        "destination is <projectRoot>/.spectra/document.bin",
        r.destination === expected,
        r.destination,
    );
    check("bytes written > 0", r.bytesWritten > 0, String(r.bytesWritten));
    check(
        "destination DOES live inside the passed project root",
        r.destination.startsWith(EXAMPLE_API_PROJECT_ROOT),
        r.destination,
    );
    check(
        ".spectra folder created relative to project root, not cwd",
        r.destination === `${EXAMPLE_API_PROJECT_ROOT}/.spectra/document.bin`,
        r.destination,
    );
    check(
        "info scanned from package.json",
        r.documentation.info.title === "@spectra/example-api",
        r.documentation.info.title,
    );
    check(
        "servers scanned (at least 1 from bootstrap port)",
        r.documentation.servers.length >= 1,
        String(r.documentation.servers.length),
    );
    check(
        "tags scanned (controllers produce tags)",
        r.documentation.tags.length >= 1,
        String(r.documentation.tags.length),
    );
    check(
        "schemas scanned (DTOs produce schemas)",
        Object.keys(r.documentation.components.schemas).length >= 1,
        String(Object.keys(r.documentation.components.schemas).length),
    );
    check(
        "paths scanned (controllers produce paths)",
        Object.keys(r.documentation.paths).length >= 1,
        String(Object.keys(r.documentation.paths).length),
    );
    check(
        "verification round-trip OK",
        r.verification?.ok === true,
        r.verification?.error ?? "ok",
    );

    // ---- Post-flight cleanup -----------------------------------------
    await rm(spectraDir, { recursive: true, force: true });
    console.log(`\nPost-flight: removed ${spectraDir}`);

    console.log(`\nSummary: ${pass}/${total}`);
    if (pass !== total) process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
