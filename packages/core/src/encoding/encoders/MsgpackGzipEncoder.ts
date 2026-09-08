import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

import { encode as msgpackEncode, decode as msgpackDecode } from "@msgpack/msgpack";

import type { Documentation } from "../../models/Documentation";
import { SpectraFormatError } from "../errors/SpectraError";
import type {
    EncoderMetadata,
    IDocumentationEncoder,
} from "../interfaces/IDocumentationEncoder";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Magic header bytes: "SPBC" (Spectra Binary Container).
 *
 * <p>Stored as a single readonly Uint8Array so it's shared across every
 * encode/decode call without reallocating.</p>
 */
export const SPECTRA_BIN_MAGIC = new Uint8Array([0x53, 0x50, 0x42, 0x43]);

/** Current binary format version (little-endian uint32 in the header). */
export const SPECTRA_BIN_VERSION = 1;

/** Size of the fixed-size header prepended to every payload (in bytes). */
export const SPECTRA_BIN_HEADER_SIZE = 8;

/**
 * Concrete encoder that turns a {@link Documentation} into opaque bytes
 * via the pipeline:
 *
 * <pre>
 *   Documentation
 *        ↓ msgpack.encode
 *   Uint8Array (msgpack)
 *        ↓ gzip
 *   Buffer (gzipped)
 *        ↓ prepend 8-byte header  (magic + version)
 *   Buffer (final)
 * </pre>
 *
 * <p>Single Responsibility: only knows how to encode / decode this
 * specific format. The pipeline composes this with a writer; tests
 * can exercise the encoder directly against in-memory buffers.</p>
 *
 * <p>Open/Closed: new formats (plain JSON, Protobuf, …) can ship as
 * sibling encoder classes implementing {@link IDocumentationEncoder}
 * without this class changing.</p>
 */
export class MsgpackGzipEncoder implements IDocumentationEncoder {
    public readonly format = "msgpack-gzip" as const;

    public async encode(
        doc: Documentation,
        options?: { readonly metadata?: EncoderMetadata },
    ): Promise<Uint8Array> {
        // Defensive: surface caller-supplied metadata in the encoded
        // payload's surrounding logs only — we don't persist it in the
        // bytes themselves, since the goal is a compact opaque blob.
        // The parameter is honoured so callers can introduce future
        // fields (timestamps, content hashes) without breaking the
        // interface.
        void options?.metadata;

        // 1. Documentation → msgpack. msgpack handles plain object
        //    graphs of primitives and arrays natively.
        const packed: Uint8Array = msgpackEncode(doc as unknown as Record<string, unknown>);

        // 2. msgpack → gzip. Default level (6) is a good speed/ratio
        //    trade-off for JSON-like trees — Documentation payloads
        //    are dominated by repetitive field names that gzip handles
        //    well.
        const compressed: Buffer = await gzipAsync(Buffer.from(packed));

        // 3. Prepend the 8-byte header so consumers can identify the
        //    file without relying on extension alone.
        const header = Buffer.alloc(SPECTRA_BIN_HEADER_SIZE);
        header.set(SPECTRA_BIN_MAGIC, 0);
        header.writeUInt32LE(SPECTRA_BIN_VERSION, 4);

        return new Uint8Array(Buffer.concat([header, compressed]));
    }

    public async decode(bytes: Uint8Array): Promise<Documentation> {
        if (bytes.byteLength < SPECTRA_BIN_HEADER_SIZE) {
            throw new SpectraFormatError(
                `Spectra bin file is too short: ${bytes.byteLength} bytes (need at least ${SPECTRA_BIN_HEADER_SIZE}).`,
            );
        }

        // Header check — reject anything that doesn't carry our magic
        // so we fail fast on accidental reads of arbitrary binaries.
        for (let i = 0; i < SPECTRA_BIN_MAGIC.length; i++) {
            if (bytes[i] !== SPECTRA_BIN_MAGIC[i]) {
                throw new SpectraFormatError(
                    "Not a Spectra binary document (magic header mismatch).",
                );
            }
        }

        const version = readUInt32LE(bytes, 4);
        if (version !== SPECTRA_BIN_VERSION) {
            throw new SpectraFormatError(
                `Unsupported Spectra bin version: ${version} (expected ${SPECTRA_BIN_VERSION}).`,
            );
        }

        const payload = bytes.subarray(SPECTRA_BIN_HEADER_SIZE);
        let decompressed: Buffer;
        try {
            decompressed = await gunzipAsync(Buffer.from(payload));
        } catch (cause) {
            throw new SpectraFormatError(
                "Failed to decompress Spectra bin payload.",
                { cause },
            );
        }

        let decoded: unknown;
        try {
            decoded = msgpackDecode(decompressed);
        } catch (cause) {
            throw new SpectraFormatError(
                "Failed to decode msgpack payload from Spectra bin.",
                { cause },
            );
        }
        return decoded as Documentation;
    }
}

/**
 * Read a little-endian uint32 from a Uint8Array starting at `offset`.
 * Inlined (instead of using Buffer) so the function works equally
 * well on `Uint8Array` instances that aren't backed by a Node Buffer
 * — this matters when the studio receives the file as an
 * `ArrayBuffer` from a `fetch` response.
 */
function readUInt32LE(bytes: Uint8Array, offset: number): number {
    return (
        (bytes[offset]! |
            (bytes[offset + 1]! << 8) |
            (bytes[offset + 2]! << 16) |
            (bytes[offset + 3]! << 24)) >>>
        0
    );
}
