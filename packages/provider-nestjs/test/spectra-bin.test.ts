/**
 * Smoke test for the `.spectra/document.bin` encode/decode pipeline.
 *
 * <p>Verifies three things:</p>
 * <ol>
 *   <li>`encodeDocumentation` followed by `decodeDocumentation`
 *       round-trips a representative Documentation object.</li>
 *   <li>`writeSpectraBin` + `readSpectraBin` produce a file on disk
 *       that the loader can read back.</li>
 *   <li>Bad inputs (wrong magic, wrong version) raise
 *       `SpectraBinFormatError` rather than a stack trace.</li>
 * </ol>
 *
 * <p>Run with `pnpm test:nest:bin` from the repo root, or via
 * `tsx packages/provider-nestjs/test/spectra-bin.test.ts`.</p>
 */

import * as os from "node:os";
import * as path from "node:path";
import { rm } from "node:fs/promises";

import {
    decodeDocumentation,
    encodeDocumentation,
    readSpectraBin,
    resolveSpectraBinPath,
    SpectraFormatError,
    writeSpectraBin,
} from "@spectra/core/encoding";
import type { Documentation } from "@spectra/core";

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
}

function buildSampleDoc(): Documentation {
    return {
        id: "documentation",
        info: {
            id: "info",
            title: "Sample API",
            version: "1.2.3",
            summary: "A tiny API used to verify the Spectra bin codec.",
        },
        servers: [
            {
                id: "server-production",
                name: "Production",
                url: "https://api.example.com/v1",
                description: "Live cluster",
            },
        ],
        tags: [
            {
                id: "tag-users",
                name: "Users",
                description: "Endpoints that manage user accounts.",
            },
        ],
        components: {
            schemas: {},
            responses: {},
            parameters: {},
            requestBodies: {},
            headers: {},
            examples: {},
            securitySchemes: {},
        },
        paths: {},
    };
}

async function main(): Promise<void> {
    // ---- 1. In-memory round-trip --------------------------------------
    const original = buildSampleDoc();
    const encoded = await encodeDocumentation(original);
    assert(encoded.byteLength > 8, "Encoded buffer must include the 8-byte header");

    const decoded = await decodeDocumentation(encoded);
    assert(decoded.info.title === original.info.title, "title round-trip");
    assert(decoded.info.version === original.info.version, "version round-trip");
    assert(decoded.servers.length === 1, "server count round-trip");
    assert(decoded.servers[0]?.url === original.servers[0]?.url, "server URL round-trip");
    assert(decoded.tags[0]?.name === "Users", "tag name round-trip");
    console.log("OK  round-trip via encodeDocumentation/decodeDocumentation");

    // ---- 2. Filesystem round-trip -------------------------------------
    const projectRoot = await import("node:fs/promises").then(fs =>
        fs.mkdtemp(path.join(os.tmpdir(), "spectra-bin-")),
    );
    try {
        const target = await writeSpectraBin(original, projectRoot);
        const expected = resolveSpectraBinPath(projectRoot);
        assert(target === expected, "writeSpectraBin returns the canonical path");
        assert(
            target.endsWith(`${path.sep}.spectra${path.sep}document.bin`),
            "target lives under .spectra/document.bin",
        );

        const fromDisk = await readSpectraBin(projectRoot);
        assert(
            fromDisk.info.title === original.info.title,
            "title round-trip via file",
        );
        console.log(`OK  round-trip via writeSpectraBin/readSpectraBin (${target})`);
    } finally {
        await rm(path.join(projectRoot, ".spectra"), { recursive: true, force: true });
        await rm(projectRoot, { recursive: true, force: true });
    }

    // ---- 3. Format error paths ----------------------------------------
    let magicErr: unknown;
    try {
        await decodeDocumentation(new Uint8Array([0, 0, 0, 0, 1, 0, 0, 0, 0]));
        magicErr = null;
    } catch (e) {
        magicErr = e;
    }
    assert(
        magicErr instanceof SpectraFormatError,
        "wrong magic raises SpectraFormatError",
    );
    console.log("OK  wrong magic rejected with SpectraFormatError");

    let versionErr: unknown;
    try {
        // Valid magic, but version 999 instead of 1.
        const bytes = new Uint8Array([0x53, 0x50, 0x42, 0x43, 0xe7, 0x03, 0, 0, 0]);
        await decodeDocumentation(bytes);
        versionErr = null;
    } catch (e) {
        versionErr = e;
    }
    assert(
        versionErr instanceof SpectraFormatError,
        "wrong version raises SpectraFormatError",
    );
    console.log("OK  unsupported version rejected with SpectraFormatError");

    console.log("ALL OK");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
