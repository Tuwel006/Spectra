import type { Documentation } from "@spectra/core";

/**
 * Single Responsibility: produce a fully-formed {@link Documentation}
 * value object from a project root directory.
 *
 * <p>Implementations do not perform any I/O beyond reading source
 * files; they don't encode, write, or talk to a remote destination.
 * That separation keeps the builder testable in isolation and lets
 * alternative builders (e.g. an in-memory builder fed by synthetic
 * source files) drop in without touching the pipeline.</p>
 */
export interface IDocumentationBuilder {
    /**
     * Build the Documentation for the project root this builder was
     * configured with. Pure / synchronous — no disk writes.
     *
     * @throws when the project can't be inspected (missing tsconfig,
     *   malformed package.json, etc).
     */
    build(): Documentation;
}
