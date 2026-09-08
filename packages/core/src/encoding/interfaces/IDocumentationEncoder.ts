import type { Documentation } from "../../models/Documentation";

/**
 * Format identifier for a {@link IDocumentationEncoder}.
 *
 * <p>Used by callers that need to pick an encoder at runtime (e.g. by
 * configuration) or to label output files. Each concrete encoder
 * declares exactly one value here.</p>
 */
export type DocumentationFormat = "msgpack-gzip";

/**
 * Free-form metadata that an encoder can attach to the encoded bytes
 * (or to its decoded result) without changing the wire format. Useful
 * for things like checksums, encoding timestamps, or producer
 * identifiers that are useful for diagnostics but aren't part of the
 * binary container itself.
 */
export interface EncoderMetadata {
    readonly [key: string]: string | number | boolean | undefined;
}

/**
 * Single Responsibility: turn a {@link Documentation} value object
 * into opaque bytes (and back).
 *
 * <p>An encoder does <strong>not</strong> perform filesystem I/O, does
 * not decide where the bytes go, and does not depend on any framework.
 * It is a pure function object — pluggable, testable in isolation.</p>
 *
 * <p>This interface is intentionally tiny (one method each direction)
 * so any new format — JSON, Protobuf, plain msgpack — can be plugged
 * in without forcing changes elsewhere in the pipeline (Open/Closed
 * Principle).</p>
 */
export interface IDocumentationEncoder {
    /** Identifier for the wire format — used in error messages and logs. */
    readonly format: DocumentationFormat;

    /**
     * Serialise the Documentation value object to bytes.
     *
     * @param doc The Documentation to encode.
     * @param options Optional per-call metadata.
     */
    encode(
        doc: Documentation,
        options?: { readonly metadata?: EncoderMetadata },
    ): Promise<Uint8Array>;

    /**
     * Parse bytes back into a Documentation value object.
     *
     * <p>Implementations should throw a domain-specific error
     * (e.g. {@link SpectraFormatError}) when the input cannot be
     * parsed — never a generic `Error`.</p>
     */
    decode(bytes: Uint8Array): Promise<Documentation>;
}
