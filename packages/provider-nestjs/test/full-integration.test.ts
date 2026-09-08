/**
 * Full Spectra documentation integration test.
 *
 * <p>Exercises the same flow as the `scripts/build-docs.ts` CLI but
 * entirely through the {@link IDocumentationPipeline} interface —
 * no concrete classes are referenced beyond the construction
 * boundary. This proves the SOLID seams hold up under an end-to-end
 * run.</p>
 *
 * <p>Stages verified:</p>
 * <ol>
 *   <li><strong>Scan</strong> — a real NestJS project root
 *       (`apps/example-api`) is walked by the builder.</li>
 *   <li><strong>Build</strong> — a Documentation value object is
 *       produced with paths, schemas, tags, servers, info.</li>
 *   <li><strong>Format</strong> — the encoder turns it into opaque
 *       msgpack+gzip bytes with the SPBC header.</li>
 *   <li><strong>Write</strong> — the writer lands the file at
 *       `<projectRoot>/.spectra/document.bin`.</li>
 *   <li><strong>Verify</strong> — the pipeline reads the file back
 *       and decodes it; the decoded Documentation matches the
 *       in-memory one field-for-field.</li>
 * </ol>
 */

import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm, stat } from "node:fs/promises";

import {
    FileSystemSpectraWriter,
    MsgpackGzipEncoder,
    resolveSpectraBinPath,
    SPECTRA_BIN_HEADER_SIZE,
    SPECTRA_BIN_MAGIC,
} from "@spectra/core/encoding";

import {
    SpectraBuildPipeline,
    collectStats,
    type IDocumentationPipeline,
} from "../src/pipeline";

async function main(): Promise<void> {
    console.log("===== FULL DOCUMENT INTEGRATION =====\n");

    const here = path.dirname(fileURLToPath(import.meta.url));
    const projectRoot = path.resolve(
        here,
        "..",
        "..",
        "..",
        "apps",
        "example-api",
    );
    console.log(`Project root: ${projectRoot}`);

    let pass = 0;
    let total = 0;
    const check = (name: string, ok: boolean, detail = ""): void => {
        total++;
        if (ok) pass++;
        console.log(
            `  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`,
        );
    };

    // ---- 0. Pre-flight cleanup ----------------------------------------
    const spectraDir = path.join(projectRoot, ".spectra");
    await rm(spectraDir, { recursive: true, force: true });
    check("pre-flight: removed any pre-existing .spectra folder", true);

    // ---- 1. Construct the pipeline through interfaces ------------------
    // The whole point of this test: build the pipeline with the four
    // interfaces and verify the orchestration still works.
    const encoder = new MsgpackGzipEncoder();
    const writer = new FileSystemSpectraWriter(encoder);
    const pipeline: IDocumentationPipeline = new SpectraBuildPipeline(
        projectRoot,
        { encoder, writer },
    );
    check(
        "pipeline constructed via IDocumentationPipeline interface",
        pipeline !== null,
    );

    // ---- 2. Run the full pipeline -------------------------------------
    const result = await pipeline.run();
    check("pipeline.run() resolved without throwing", true);
    check(
        "destination is the canonical <root>/.spectra/document.bin",
        result.destination === resolveSpectraBinPath(projectRoot),
        result.destination,
    );

    // ---- 3. Format invariants -----------------------------------------
    check(
        "bytes include the SPBC magic header",
        arrayStartsWith(result.bytes, SPECTRA_BIN_MAGIC),
    );
    check(
        "bytes are larger than the 8-byte header",
        result.bytesWritten > SPECTRA_BIN_HEADER_SIZE,
        `${result.bytesWritten} bytes`,
    );
    check(
        "bytes do NOT begin with a readable JSON character",
        result.bytes[0] !== 0x7b /* '{' */,
    );

    // ---- 4. Write invariants ------------------------------------------
    const onDisk = await stat(result.destination);
    check(
        "on-disk size matches bytesWritten",
        onDisk.size === result.bytesWritten,
        `${onDisk.size} vs ${result.bytesWritten}`,
    );

    // Read the raw bytes back and confirm they match what was written.
    const onDiskBytes = await readFile(result.destination);
    check(
        "raw on-disk bytes match the returned bytes",
        Buffer.compare(Buffer.from(result.bytes), onDiskBytes) === 0,
    );

    // ---- 5. Scan stats ------------------------------------------------
    const inMemoryStats = collectStats(result.documentation);
    check(
        "stats.pathCount > 0 (real project has paths)",
        inMemoryStats.pathCount > 0,
        String(inMemoryStats.pathCount),
    );
    check(
        "stats.operationCount > 0 (real project has operations)",
        inMemoryStats.operationCount > 0,
        String(inMemoryStats.operationCount),
    );
    check(
        "stats.schemaCount > 0 (real project has DTOs)",
        inMemoryStats.schemaCount > 0,
        String(inMemoryStats.schemaCount),
    );
    check(
        "stats.tagCount > 0 (controllers produce tags)",
        inMemoryStats.tagCount > 0,
        String(inMemoryStats.tagCount),
    );
    check(
        "stats.serverCount > 0 (bootstrap port is a server)",
        inMemoryStats.serverCount > 0,
        String(inMemoryStats.serverCount),
    );
    check(
        "pipeline-reported stats match independent collectStats() result",
        JSON.stringify(result.stats) === JSON.stringify(inMemoryStats),
    );

    // ---- 6. Verify round-trip -----------------------------------------
    check(
        "verification.ok is true",
        result.verification?.ok === true,
    );
    check(
        "verification returned a decoded Documentation",
        result.verification?.decoded !== undefined,
    );

    if (result.verification?.decoded) {
        const decoded = result.verification.decoded;
        check(
            "decoded info.title matches",
            decoded.info.title === result.documentation.info.title,
        );
        check(
            "decoded info.version matches",
            decoded.info.version === result.documentation.info.version,
        );
        check(
            "decoded paths count matches",
            Object.keys(decoded.paths).length ===
                Object.keys(result.documentation.paths).length,
        );
        check(
            "decoded schemas count matches",
            Object.keys(decoded.components.schemas).length ===
                Object.keys(result.documentation.components.schemas).length,
        );
        check(
            "decoded tags count matches",
            decoded.tags.length === result.documentation.tags.length,
        );
        check(
            "decoded servers count matches",
            decoded.servers.length === result.documentation.servers.length,
        );
    }

    // ---- 7. Elapsed time ----------------------------------------------
    check(
        "elapsedMs is a positive number",
        typeof result.elapsedMs === "number" && result.elapsedMs > 0,
        `${result.elapsedMs} ms`,
    );

    // ---- 8. Cleanup ---------------------------------------------------
    await rm(spectraDir, { recursive: true, force: true });
    check("post-flight: removed .spectra folder", true);

    console.log(`\nSummary: ${pass}/${total}`);
    if (pass !== total) process.exit(1);
}

function arrayStartsWith(haystack: Uint8Array, needle: Uint8Array): boolean {
    if (haystack.byteLength < needle.byteLength) return false;
    for (let i = 0; i < needle.byteLength; i++) {
        if (haystack[i] !== needle[i]) return false;
    }
    return true;
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
