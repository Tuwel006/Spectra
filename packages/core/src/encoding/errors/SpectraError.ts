/**
 * Base class for every error thrown by the Spectra encoding stack.
 *
 * <p>Catching this base is the right thing to do at the pipeline
 * level — it covers both encoding/decoding errors and I/O errors
 * without leaking transport-specific details. Subclasses carry
 * additional context for callers that want it.</p>
 */
export abstract class SpectraError extends Error {
    protected constructor(message: string, options?: { readonly cause?: unknown }) {
        super(message, options);
        this.name = new.target.name;
    }
}

/**
 * Thrown by {@link IDocumentationEncoder.decode} when the input bytes
 * are not a valid Spectra document — wrong magic header, unsupported
 * version, corrupt payload, etc.
 */
export class SpectraFormatError extends SpectraError {
    constructor(message: string, options?: { readonly cause?: unknown }) {
        super(message, options);
    }
}

/**
 * Thrown by {@link IDocumentationWriter} when a destination cannot
 * be read or written — file not found, permission denied, parent
 * directory cannot be created, etc.
 */
export class SpectraWriterError extends SpectraError {
    constructor(message: string, options?: { readonly cause?: unknown }) {
        super(message, options);
    }
}
