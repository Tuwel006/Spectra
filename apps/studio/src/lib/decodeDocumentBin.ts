import { decode as msgpackDecode } from "@msgpack/msgpack";
import { ungzip } from "pako";

import type { Documentation } from "@spectra/core";

/**
 * The SPBC magic header — must match the bytes the CLI's
 * {@link MsgpackGzipEncoder} prepends in
 * {@link packages/core/src/encoding/encoders/MsgpackGzipEncoder.ts}.
 */
const SPECTRA_BIN_MAGIC = new Uint8Array([0x53, 0x50, 0x42, 0x43]);
const SPECTRA_BIN_HEADER_SIZE = 8;

/**
 * Result of a successful decode.
 */
export interface DecodedDocument {
    readonly documentation: Documentation;
    readonly version: number;
    readonly decodedAt: number;
}

/**
 * Resolve the endpoint prefix from the current page URL.
 *
 * <p>The studio is mounted at a configurable endpoint (e.g. <code>/api-explorer</code>)
 * and the runtime serves <code>document.bin</code> from that same
 * endpoint. Returning the path minus its trailing slash lets relative
 * <code>source</code> values resolve to <code>&lt;endpoint&gt;/document.bin</code>.</p>
 *
 * <p>Re-exported so the test suite can stub it via
 * <code>vi.mock("./decodeDocumentBin", …)</code>.</p>
 */
export function endpointFromLocation(): string {
    if (typeof window === "undefined") return "/spectra";
    return window.location.pathname.replace(/\/$/, "") || "/spectra";
}

/**
 * Fetches the encoded Spectra document over HTTP and decodes it
 * client-side using msgpack + gzip + the SPBC magic header.
 *
 * <p>Beginner-friendly note on the three encoding layers:</p>
 * <ol>
 *   <li><strong>Magic header</strong> — first 4 bytes must be
 *       <code>"SPBC"</code>; we fail loud if they don't so the user
 *       sees a clear error instead of a "garbled JSON" UI.</li>
 *   <li><strong>gzip</strong> — what pako ungzips. We feed it
 *       everything after the 8-byte header.</li>
 *   <li><strong>msgpack</strong> — what the @msgpack/msgpack decoder
 *       turns into a plain JS value graph.</li>
 * </ol>
 *
 * <p>That's it — after this function returns, the user has a
 * fully-typed {@link Documentation} value with no JSON-shaped
 * intermediate (msgpack is binary, smaller and faster than JSON).</p>
 *
 * <p>If <code>source</code> begins with <code>/</code> it is treated
 * as an absolute URL path. Otherwise the current endpoint
 * (<code>endpointFromLocation()</code>) is prepended so a relative
 * <code>"document.bin"</code> resolves to
 * <code>&lt;endpoint&gt;/document.bin</code> rather than host root.</p>
 */
export async function loadDocumentBin(
    source: string = "document.bin",
    fetcher: typeof fetch = fetch,
): Promise<DecodedDocument> {
    const url = source.startsWith("/")
        ? source
        : `${endpointFromLocation()}/${source}`;
    const response = await fetcher(url);
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
        );
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.byteLength < SPECTRA_BIN_HEADER_SIZE) {
        throw new Error(
            `Spectra bin file is too short: ${bytes.byteLength} bytes (need at least ${SPECTRA_BIN_HEADER_SIZE}).`,
        );
    }

    for (let i = 0; i < SPECTRA_BIN_MAGIC.length; i++) {
        if (bytes[i] !== SPECTRA_BIN_MAGIC[i]) {
            throw new Error(
                "Not a Spectra binary document (magic header mismatch).",
            );
        }
    }

    const version = readUInt32LE(bytes, 4);
    const payload = bytes.subarray(SPECTRA_BIN_HEADER_SIZE);

    // pako.ungzip returns a Uint8Array of decompressed bytes.
    const decompressed = ungzip(payload);
    const documentation = msgpackDecode(decompressed) as Documentation;

    return {
        documentation,
        version,
        decodedAt: Date.now(),
    };
}

/** Little-endian uint32 read — mirrors the helper in MsgpackGzipEncoder. */
function readUInt32LE(bytes: Uint8Array, offset: number): number {
    return (
        (bytes[offset]! |
            (bytes[offset + 1]! << 8) |
            (bytes[offset + 2]! << 16) |
            (bytes[offset + 3]! << 24)) >>>
        0
    );
}
