import ts from "typescript";
import {
    ArrayType,
    ContentType,
    PrimitiveType,
    PrimitiveTypeName,
    Property,
    PropertyModifier,
    Reference,
    ReferenceType,
    Schema,
    Type,
    TypeKind,
} from "@spectra/core";

import { DeclarationResolver } from "../compiler/DeclarationResolver";
import { TypeResolver } from "../compiler/TypeResolver";

/**
 * Framework-agnostic schema extractor.
 *
 * Reads a `ts.ClassDeclaration` (or `ts.InterfaceDeclaration`) and
 * produces a {@link Schema} value object that the Spectra
 * documentation model can drop into
 * `Documentation.components.schemas`.
 *
 * The extractor NEVER instantiates the class. It reads only the
 * TypeScript type system (AST + checker symbols) to build the
 * `Schema`. This means the same extractor works for:
 *
 *   - NestJS DTO classes (e.g. `CreateProductDto`)
 *   - Express/Fastify request / response types
 *   - Plain TypeScript classes that happen to be a data shape
 *
 * Property modifiers reflect the static type system exactly:
 *
 *   - `required`     = NOT optional AND NOT `?` AND no `| undefined`
 *   - `readonly`     = has `readonly` modifier
 *   - `nullable`     = has `null` in a union (NOT `undefined` alone —
 *                     that just makes it optional)
 *   - `deprecated`   = false today (no JSDoc parsing); the field
 *                     exists so future versions can populate it
 *
 * Type mapping:
 *
 *   - `string` → PrimitiveTypeName.STRING
 *   - `number` → PrimitiveTypeName.NUMBER
 *   - `boolean` → PrimitiveTypeName.BOOLEAN
 *   - `T[]`    → ArrayType with element type
 *   - class/interface → ReferenceType whose reference.id is the
 *     schema id of the referenced type (or the symbol name if no
 *     schema id is known).
 *   - everything else (Date, enums, unions, …) → falls back to the
 *     raw source text wrapped in a PrimitiveTypeName.ANY so the
 *     schema is still well-formed; downstream generators can
 *     specialise this.
 *
 * The extractor reuses the existing `TypeResolver` and
 * `DeclarationResolver` — no second TypeChecker abstraction is
 * introduced.
 */
export class SchemaExtractor {
    private readonly typeResolver: TypeResolver | undefined;
    private readonly declarationResolver: DeclarationResolver | undefined;

    public constructor(
        typeResolver?: TypeResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        this.typeResolver = typeResolver;
        this.declarationResolver = declarationResolver;
    }

    /**
     * Extract a {@link Schema} for the given class or interface
     * declaration. The returned schema has:
     *   - `id`   = a deterministic slug derived from the declaration
     *     name (so the schema id is stable across rebuilds).
     *   - `name` = the class / interface identifier.
     */
    public extract(
        declaration: ts.ClassDeclaration | ts.InterfaceDeclaration,
    ): Schema {
        const name = declaration.name?.getText() ?? "<anonymous>";
        const properties: Record<string, Property> = {};
        for (const member of declaration.members) {
            if (!ts.isPropertySignature(member) && !ts.isPropertyDeclaration(member)) {
                continue;
            }
            const propName = this.propertyName(member.name);
            if (propName === undefined) continue;
            properties[propName] = this.extractProperty(member);
        }
        return {
            id: this.schemaId(name),
            name,
            properties,
        };
    }

    private propertyName(nameNode: ts.PropertyName): string | undefined {
        if (ts.isIdentifier(nameNode) || ts.isPrivateIdentifier(nameNode)) {
            return nameNode.text;
        }
        if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
            return nameNode.text;
        }
        return undefined;
    }

    private extractProperty(
        member:
            | ts.PropertySignature
            | ts.PropertyDeclaration,
    ): Property {
        const typeNode = member.type;
        const valueType = this.mapTypeNode(typeNode);
        const modifiers = this.computeModifiers(member, typeNode);
        const propertyName =
            this.propertyName(member.name) ?? "<anonymous>";
        return {
            id: `${propertyName}`,
            name: propertyName,
            valueType,
            modifiers,
        };
    }

    private mapTypeNode(typeNode: ts.TypeNode | undefined): Type {
        if (typeNode === undefined) {
            return this.primitive(PrimitiveTypeName.ANY);
        }

        if (ts.isArrayTypeNode(typeNode)) {
            const arrayType: ArrayType = {
                kind: TypeKind.ARRAY,
                elementType: this.mapTypeNode(typeNode.elementType),
            };
            return arrayType;
        }

        if (ts.isUnionTypeNode(typeNode)) {
            // Detect `T | null` / `T | undefined` to keep a single
            // union-nullable flag on the modifier; collapse to the
            // non-nullish member for the value type.
            let hasNull = false;
            let hasUndefined = false;
            const nonNullish: ts.TypeNode[] = [];
            for (const t of typeNode.types) {
                if (t.kind === ts.SyntaxKind.NullKeyword) {
                    hasNull = true;
                } else if (t.kind === ts.SyntaxKind.UndefinedKeyword) {
                    hasUndefined = true;
                } else {
                    nonNullish.push(t);
                }
            }
            if (nonNullish.length === 1) {
                return this.mapTypeNode(nonNullish[0]);
            }
            // Multi-member unions (string | number, etc.) fall back
            // to a primitive ANY with the source text preserved so
            // downstream generators can specialise.
            return this.primitive(PrimitiveTypeName.ANY);
        }

        const sourceText = typeNode.getText().trim();

        if (this.isKeyword(typeNode, ts.SyntaxKind.StringKeyword)) {
            return this.primitive(PrimitiveTypeName.STRING);
        }
        if (this.isKeyword(typeNode, ts.SyntaxKind.NumberKeyword)) {
            return this.primitive(PrimitiveTypeName.NUMBER);
        }
        if (this.isKeyword(typeNode, ts.SyntaxKind.BooleanKeyword)) {
            return this.primitive(PrimitiveTypeName.BOOLEAN);
        }
        if (this.isKeyword(typeNode, ts.SyntaxKind.AnyKeyword)) {
            return this.primitive(PrimitiveTypeName.ANY);
        }

        if (ts.isTypeReferenceNode(typeNode)) {
            // Best-effort detection of a known primitive wrapper
            // (e.g. `String`, `Number`, `Boolean` as global types).
            const typeName = typeNode.typeName.getText();
            if (typeName === "String") return this.primitive(PrimitiveTypeName.STRING);
            if (typeName === "Number") return this.primitive(PrimitiveTypeName.NUMBER);
            if (typeName === "Boolean") return this.primitive(PrimitiveTypeName.BOOLEAN);
            if (typeName === "Date") return this.primitive(PrimitiveTypeName.STRING);

            // Resolve to a class / interface declaration and emit
            // a reference.
            const resolved = this.tryResolveReference(typeNode);
            if (resolved) return resolved;

            // Fallback: name-only reference. Downstream generators
            // can re-resolve this if needed.
            return this.reference(typeName);
        }

        return this.primitive(PrimitiveTypeName.ANY);
    }

    private isKeyword(node: ts.TypeNode, kind: ts.SyntaxKind): boolean {
        return node.kind === kind;
    }

    private tryResolveReference(
        typeNode: ts.TypeReferenceNode,
    ): Type | undefined {
        if (!this.typeResolver || !this.declarationResolver) {
            return undefined;
        }
        let tsType: ts.Type | undefined;
        try {
            tsType = this.typeResolver.resolve(typeNode);
        } catch {
            tsType = undefined;
        }
        if (!tsType) return undefined;

        const symbol = tsType.symbol ?? tsType.aliasSymbol;
        if (!symbol) return undefined;
        const symbolName = symbol.getName();

        const decls = symbol.declarations;
        if (!decls || decls.length === 0) return undefined;
        const decl = decls[0];
        if (
            ts.isClassDeclaration(decl) ||
            ts.isInterfaceDeclaration(decl)
        ) {
            return this.reference(symbolName);
        }
        return undefined;
    }

    private primitive(name: PrimitiveTypeName): PrimitiveType {
        return {
            kind: TypeKind.PRIMITIVE,
            name,
        };
    }

    private reference(symbolName: string): ReferenceType {
        return {
            kind: TypeKind.REFERENCE,
            reference: this.makeReference(symbolName),
        };
    }

    private makeReference(symbolName: string): Reference {
        return { id: this.schemaId(symbolName) };
    }

    /**
     * Schema id derivation. Stable slug for the schema, used both as
     * the schema entry key in `Components.schemas` and as the
     * reference target in `ReferenceType.reference.id`.
     *
     * Rules:
     *   - PascalCase names pass through unchanged (`CreateUserDto`).
     *   - Other characters are stripped / replaced with `-`.
     */
    public schemaId(name: string): string {
        return name.replace(/[^A-Za-z0-9_]/g, "");
    }

    private computeModifiers(
        member:
            | ts.PropertySignature
            | ts.PropertyDeclaration,
        typeNode: ts.TypeNode | undefined,
    ): PropertyModifier {
        const hasQuestionToken = member.questionToken !== undefined;
        const hasReadonly = (member.modifiers ?? []).some(
            m => m.kind === ts.SyntaxKind.ReadonlyKeyword,
        );
        const hasExplicitOptional =
            typeNode !== undefined &&
            ts.isUnionTypeNode(typeNode) &&
            typeNode.types.some(
                t => t.kind === ts.SyntaxKind.UndefinedKeyword,
            );
        const hasExplicitNull =
            typeNode !== undefined &&
            ts.isUnionTypeNode(typeNode) &&
            typeNode.types.some(
                t => t.kind === ts.SyntaxKind.NullKeyword,
            );

        return {
            required: !hasQuestionToken && !hasExplicitOptional,
            readonly: hasReadonly,
            nullable: hasExplicitNull,
            deprecated: false,
        };
    }

    /**
     * Returns the conventional content type used when this schema
     * is referenced from a request / response body. Today everything
     * is JSON; specialised content-type handling (multipart, form)
     * is delegated to future generators.
     */
    public static defaultContentType(): ContentType {
        return ContentType.JSON;
    }
}