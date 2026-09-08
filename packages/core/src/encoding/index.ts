/* ------------------------------------------------------------------ */
/* Interfaces                                                          */
/* ------------------------------------------------------------------ */

export type {
    IDocumentationEncoder,
    DocumentationFormat,
    EncoderMetadata,
} from "./interfaces/IDocumentationEncoder";

export type {
    IDocumentationWriter,
    DocumentationDestination,
    WriteResult,
} from "./interfaces/IDocumentationWriter";

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export {
    SpectraError,
    SpectraFormatError,
    SpectraWriterError,
} from "./errors/SpectraError";

/* ------------------------------------------------------------------ */
/* Encoders                                                            */
/* ------------------------------------------------------------------ */

export {
    MsgpackGzipEncoder,
    SPECTRA_BIN_MAGIC,
    SPECTRA_BIN_VERSION,
    SPECTRA_BIN_HEADER_SIZE,
} from "./encoders/MsgpackGzipEncoder";

/* ------------------------------------------------------------------ */
/* Writers                                                             */
/* ------------------------------------------------------------------ */

export {
    FileSystemSpectraWriter,
    SPECTRA_DIR_NAME,
    SPECTRA_BIN_FILE_NAME,
    resolveSpectraBinPath,
} from "./writers/FileSystemSpectraWriter";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

export {
    readSpectraConfig,
    writeSpectraConfig,
    resolveSpectraConfigPath,
    SPECTRA_DEFAULT_ENDPOINT,
    SPECTRA_CONFIG_FILE_NAME,
    type SpectraConfig,
} from "./config/SpectraConfig";

/* ------------------------------------------------------------------ */
/* Convenience helpers                                                */
/* ------------------------------------------------------------------ */
// These helpers exist for ad-hoc consumers (scripts, tests) that don't
// want to wire DI containers manually. They construct the default
// encoder + filesystem writer pair and delegate to the interfaces, so
// they don't bypass the abstraction — they just sugar over it.

import type { Documentation } from "../models/Documentation";
import { MsgpackGzipEncoder } from "./encoders/MsgpackGzipEncoder";
import { FileSystemSpectraWriter, resolveSpectraBinPath as resolveBinPath } from "./writers/FileSystemSpectraWriter";

/** Default encoder instance — memoised at module load. */
const defaultEncoder = new MsgpackGzipEncoder();
/** Default filesystem writer instance, wired with the default encoder. */
const defaultWriter = new FileSystemSpectraWriter(defaultEncoder);

/**
 * Encode a Documentation with the default msgpack-gzip encoder.
 * Equivalent to `new MsgpackGzipEncoder().encode(doc)`.
 */
export function encodeDocumentation(doc: Documentation): Promise<Uint8Array> {
    return defaultEncoder.encode(doc);
}

/**
 * Decode bytes with the default msgpack-gzip encoder.
 * Equivalent to `new MsgpackGzipEncoder().decode(bytes)`.
 */
export function decodeDocumentation(bytes: Uint8Array): Promise<Documentation> {
    return defaultEncoder.decode(bytes);
}

/**
 * Encode + write a Documentation to `<projectRoot>/.spectra/document.bin`.
 * Returns the absolute file path that was written.
 */
export async function writeSpectraBin(
    doc: Documentation,
    projectRoot: string,
): Promise<string> {
    const target = resolveBinPath(projectRoot);
    const result = await defaultWriter.write(doc, target);
    return result.destination;
}

/**
 * Read + decode a Documentation from
 * `<projectRoot>/.spectra/document.bin`.
 */
export function readSpectraBin(projectRoot: string): Promise<Documentation> {
    return defaultWriter.read(resolveBinPath(projectRoot));
}
