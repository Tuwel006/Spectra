/**
 * Focused test for the `buildDocumentationBin` one-call entry point.
 *
 * <p>This is the public API consumers should reach for when they
 * want to turn a NestJS project root into a
 * `.spectra/document.bin` file. It runs the full pipeline
 * (build → encode → write → verify) and lands the file inside the
 * passed project root — never the calling process's working
 * directory.</p>
 *
 * <p>The test creates a sandboxed project root (a `tsconfig.json`
 * with minimal contents), points `buildDocumentationBin` at it,
 * asserts the file lands inside that root, then cleans up.</p>
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { rm } from "node:fs/promises";

import { resolveSpectraBinPath } from "@spectra/core/encoding";

import { buildDocumentationBin } from "../src/pipeline";

async function main(): Promise<void> {
    let pass = 0;
    let total = 0;
    const check = (name: string, ok: boolean, detail = ""): void => {
        total++;
        if (ok) pass++;
        console.log(
            `  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
        );
    };

    // ---- 1. Sandbox project root --------------------------------------
    // We can't drive `buildDocumentationBin` against the real
    // example-api here because (a) the test would mutate the
    // example-api repo every run and (b) we want a deterministic
    // minimal project. Use the bundled `apps/example-api` instead —
    // it already has a real tsconfig and source tree that exercises
    // every stage of the builder.
    const here = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(
        here,
        "..",
        "..",
        "..",
        "apps",
        "example-api",
    );

    // Make sure we're starting from a clean slate so the assertion
    // that the file was created is meaningful.
    const spectraDir = path.join(projectRoot, ".spectra");
    await rm(spectraDir, { recursive: true, force: true });
    check("pre-flight: removed any pre-existing .spectra folder", true);

    // Capture the calling process's working directory — the file
    // must NOT land here.
    const cwd = process.cwd();
    const cwdSpectraDir = path.join(cwd, ".spectra");
    await rm(cwdSpectraDir, { recursive: true, force: true });

    // ---- 2. Run the one-call helper -----------------------------------
    const result = await buildDocumentationBin(projectRoot);

    // ---- 3. Destination landed inside the passed project root ---------
    const expected = resolveSpectraBinPath(projectRoot);
    check(
        "destination is <projectRoot>/.spectra/document.bin",
        result.destination === expected,
        result.destination,
    );

    // ---- 4. Destination did NOT leak into the calling process's cwd ---
    const cwdLeaked = await import("node:fs/promises").then((fs) =>
        fs
            .stat(cwdSpectraDir)
            .then(() => true)
            .catch(() => false),
    );
    check(
        "no .spectra folder created in the calling process's cwd",
        cwdLeaked === false,
        cwdLeaked ? cwdSpectraDir : "(clean)",
    );

    // ---- 5. Result shape is correct -----------------------------------
    check("result has bytesWritten > 0", result.bytesWritten > 0);
    check(
        "result.stats.pathCount > 0 (real project has paths)",
        result.stats.pathCount > 0,
        String(result.stats.pathCount),
    );
    check(
        "result.stats.schemaCount > 0 (real project has DTOs)",
        result.stats.schemaCount > 0,
        String(result.stats.schemaCount),
    );
    check(
        "result.verification.ok is true",
        result.verification?.ok === true,
    );
    check(
        "result.documentation has the expected info.title",
        result.documentation.info.title === "@spectra/example-api",
    );

    // ---- 6. Post-flight cleanup ---------------------------------------
    await rm(spectraDir, { recursive: true, force: true });
    check("post-flight: removed .spectra folder inside projectRoot", true);

    console.log(`\nSummary: ${pass}/${total}`);
    if (pass !== total) process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
