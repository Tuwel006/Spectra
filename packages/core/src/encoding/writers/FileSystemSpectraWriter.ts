import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

import type { Documentation } from "../../models/Documentation";
import { SpectraWriterError } from "../errors/SpectraError";
import type {
    DocumentationDestination,
    IDocumentationWriter,
    WriteResult,
} from "../interfaces/IDocumentationWriter";
import type {
    EncoderMetadata,
    IDocumentationEncoder,
} from "../interfaces/IDocumentationEncoder";

/**
 * Directory name (under the supplied project root) where Spectra
 * documentation binaries are cached. Hidden behind a dot-prefix so a
 * casual `ls` doesn't surface it.
 */
export const SPECTRA_DIR_NAME = ".spectra";

/**
 * Default file name used when the consumer passes an empty
 * destination — usually a project root rather than an explicit file
 * path.
 */
export const SPECTRA_BIN_FILE_NAME = "document.bin";

/**
 * Filesystem-backed implementation of {@link IDocumentationWriter}.
 *
 * <p>Single Responsibility: knows how to read and write opaque bytes
 * on disk. It does <strong>not</strong> know how to encode them — the
 * encoder is injected via the constructor (Dependency Inversion).</p>
 *
 * <p>The constructor takes the encoder as a collaborator so the same
 * writer can be reused with different on-wire formats just by
 * passing a different encoder instance.</p>
 */
export class FileSystemSpectraWriter implements IDocumentationWriter {
    public constructor(
        private readonly encoder: IDocumentationEncoder,
    ) {}

    /**
     * Encode a Documentation and write the resulting bytes to the
     * destination path on disk. Missing parent directories are
     * created automatically.
     */
    public async write(
        doc: Documentation,
        destination: DocumentationDestination,
        options?: { readonly metadata?: EncoderMetadata },
    ): Promise<WriteResult> {
        const target = this.resolveDestination(destination);

        const bytes = await this.encoder.encode(doc, options);

        try {
            await mkdir(path.dirname(target), { recursive: true });
            await writeFile(target, Buffer.from(bytes));
        } catch (cause) {
            throw new SpectraWriterError(
                `Failed to write Spectra document to ${target}.`,
                { cause },
            );
        }

        return {
            destination: target,
            bytesWritten: bytes.byteLength,
            bytes,
        };
    }

    /**
     * Read the file at the destination path and decode its contents
     * back into a Documentation value object.
     */
    public async read(destination: DocumentationDestination): Promise<Documentation> {
        const target = this.resolveDestination(destination);

        let fileBytes: Buffer;
        try {
            fileBytes = await readFile(target);
        } catch (cause) {
            throw new SpectraWriterError(
                `Failed to read Spectra document from ${target}.`,
                { cause },
            );
        }

        return this.encoder.decode(new Uint8Array(fileBytes));
    }

    /**
     * Resolve the destination to an absolute file path. If the
     * caller supplies a bare directory (no file component), the
     * default {@link SPECTRA_BIN_FILE_NAME} is appended — this lets
     * the pipeline hand off the project root directly.
     */
    private resolveDestination(destination: DocumentationDestination): string {
        if (path.basename(destination) === "") {
            return path.join(destination, SPECTRA_BIN_FILE_NAME);
        }
        return destination;
    }
}

/**
 * Resolve the conventional `<projectRoot>/.spectra/document.bin` path
 * for a project. Pure helper — no I/O.
 */
export function resolveSpectraBinPath(projectRoot: string): string {
    return path.join(projectRoot, SPECTRA_DIR_NAME, SPECTRA_BIN_FILE_NAME);
}
