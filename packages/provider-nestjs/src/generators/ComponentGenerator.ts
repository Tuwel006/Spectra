import ts from "typescript";
import { NamedCollection, Schema } from "@spectra/core";
import { NodeWalker, SchemaExtractor } from "@spectra/provider-ast";

/**
 * Walks every `ts.SourceFile` in the project, finds class and
 * interface declarations, and feeds each one through a
 * {@link SchemaExtractor} to produce
 * `Documentation.components.schemas`.
 *
 * Layering:
 *   - The walker / scanner / type-resolver are reused from
 *     `provider-ast` — no duplicate infrastructure is introduced.
 *   - The decision to expose ALL classes (not just the ones
 *     transitively referenced from operations) is intentional:
 *     documentation consumers can browse the full schema catalogue.
 *     This matches the OpenAPI convention where
 *     `components.schemas` is a global pool.
 *
 * Schemas with the same name across files are deduplicated by the
 * last write wins (deterministic by file scan order). Class names
 * are scoped to the project by convention — NestJS DTO classes
 * are conventionally unique per project.
 */
export class ComponentGenerator {
    private readonly walker: NodeWalker;
    private readonly extractor: SchemaExtractor;

    public constructor(
        walker: NodeWalker = new NodeWalker(),
        extractor: SchemaExtractor = new SchemaExtractor(),
    ) {
        this.walker = walker;
        this.extractor = extractor;
    }

    public generate(
        sourceFiles: readonly ts.SourceFile[],
    ): NamedCollection<Schema> {
        const out: Record<string, Schema> = {};

        const sortedFiles = [...sourceFiles].sort((a, b) =>
            a.fileName.localeCompare(b.fileName),
        );

        for (const sf of sortedFiles) {
            if (sf.isDeclarationFile) continue;

            this.walker.walk(sf, node => {
                if (ts.isClassDeclaration(node) && node.name) {
                    const schema = this.extractor.extract(node);
                    out[schema.id] = schema;
                } else if (ts.isInterfaceDeclaration(node) && node.name) {
                    const schema = this.extractor.extract(node);
                    out[schema.id] = schema;
                }
            });
        }
        return out;
    }
}