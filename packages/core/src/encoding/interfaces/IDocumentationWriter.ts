import type { Documentation } from "../../models/Documentation";

import type { EncoderMetadata } from "./IDocumentationEncoder";

/**
 * A destination handle that the writer can write to / read from.
 *
 * <p>Implementations of {@link IDocumentationWriter} are free to
 * interpret this string however they like — for the filesystem writer
 * it is an absolute or project-root-relative path; for an S3 writer
 * it would be a bucket + key, etc. The shape is intentionally a string
 * so the writer interface stays decoupled from any concrete transport
 * (Dependency Inversion Principle).</p>
 */
export type DocumentationDestination = string;

/**
 * Result of a write operation — what was written and where.
 *
 * <p>Returning a structured result (instead of `void`) lets the
 * pipeline hand the location back to the caller without the writer
 * leaking transport-specific details (Liskov-friendly: a future S3
 * writer can return the same shape with a `s3://...` destination).</p>
 */
export interface WriteResult {
    /** The destination that was written. */
    readonly destination: DocumentationDestination;
    /** Number of bytes written — useful for logs and progress reporting. */
    readonly bytesWritten: number;
    /** Bytes that were written. Exposed so callers can verify or stream. */
    readonly bytes: Uint8Array;
}

/**
 * Single Responsibility: move encoded bytes between the encoder and a
 * durable destination.
 *
 * <p>The writer is paired with an {@link IDocumentationEncoder} via
 * dependency injection at the pipeline level. Concrete writers know
 * nothing about the on-wire format — they only know how to store and
 * retrieve opaque byte blobs (Interface Segregation: this interface
 * only knows about persistence, never about the Document shape).</p>
 */
export interface IDocumentationWriter {
    /**
     * Encode + persist a Documentation in one shot.
     *
     * <p>This is a convenience method — most callers (including the
     * pipeline) want "build then store" without manually chaining the
     * encoder and writer.</p>
     */
    write(
        doc: Documentation,
        destination: DocumentationDestination,
        options?: { readonly metadata?: EncoderMetadata },
    ): Promise<WriteResult>;

    /**
     * Read + decode bytes from a destination.
     *
     * @throws {@link SpectraFormatError} when the bytes don't decode.
     * @throws {@link SpectraWriterError} when the destination can't be read.
     */
    read(destination: DocumentationDestination): Promise<Documentation>;
}
