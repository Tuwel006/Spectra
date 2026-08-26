import ts from "typescript";
import { TypeResolver } from "@spectra/provider-ast";

/**
 * Structural + semantic view of a parameter's type (E5).
 *
 * Combines:
 *   - `sourceText`: the original TypeScript source text of the type
 *     annotation (preserved verbatim, NOT normalized away).
 *   - `flags`: raw `ts.TypeFlags` bitmask returned by the TypeChecker.
 *   - `kindName`: short textual classification (e.g. "string",
 *     "number", "boolean", "array", "union", "object").
 *   - `symbolName` / `symbolFlags` / `declarationKind`: information
 *     about the named entity the type refers to (e.g. class
 *     "CreateUserDto", interface "Product", enum "HttpStatus").
 *   - `elementKind`: for `T[]` / `Array<T>`, the element type view.
 *   - `unionMembers`: for `T | U`, the constituent type views.
 *   - `isResolved`: true when TypeResolver produced a `ts.Type`
 *     without throwing. False means we kept the source text only.
 *
 * `ParameterTypeExtractor` is the only new class. It reuses the
 * existing `TypeResolver` from `provider-ast` — no second TypeChecker
 * abstraction is created.
 *
 * NEVER instantiates DTOs, NEVER executes user code, NEVER looks up
 * values dynamically.
 */
export interface ParameterTypeView {
    readonly sourceText: string;
    readonly kindName: string;
    readonly flags: number;
    readonly isResolved: boolean;

    readonly isString: boolean;
    readonly isNumber: boolean;
    readonly isBoolean: boolean;
    readonly isPrimitive: boolean;
    readonly isVoid: boolean;
    readonly isNull: boolean;
    readonly isUndefined: boolean;

    readonly isArray: boolean;
    readonly isUnion: boolean;
    readonly isObject: boolean;

    readonly isClass: boolean;
    readonly isInterface: boolean;
    readonly isEnum: boolean;
    readonly isTypeAlias: boolean;

    readonly symbolName: string | undefined;
    readonly symbolFlags: number | undefined;
    readonly declarationKind: string | undefined;

    readonly elementKind: ParameterTypeView | undefined;
    readonly unionMembers: readonly ParameterTypeView[];
}

/**
 * Extracts a `ParameterTypeView` from a `ts.TypeNode` using the
 * existing `TypeResolver`. Handles:
 *   - Primitives (string / number / boolean / void / null / undefined).
 *   - Arrays (`T[]` and `Array<T>`) — recurses into the element type.
 *   - Unions (`T | U | V`) — recurses into each member.
 *   - Type references (classes, interfaces, enums, type aliases).
 *
 * Does NOT execute user code. Never instantiates a class. Never
 * reads runtime values. The view describes the *static type system*
 * representation only.
 */
export class ParameterTypeExtractor {
    private readonly typeResolver: TypeResolver | undefined;

    public constructor(typeResolver?: TypeResolver) {
        this.typeResolver = typeResolver;
    }

    public extract(typeNode: ts.TypeNode | undefined): ParameterTypeView {
        if (!typeNode) {
            return this.empty("");
        }
        const sourceText = typeNode.getText();

        let tsType: ts.Type | undefined;
        let isResolved = false;
        if (this.typeResolver) {
            try {
                tsType = this.typeResolver.resolve(typeNode);
                isResolved = tsType !== undefined && tsType !== null;
            } catch {
                tsType = undefined;
                isResolved = false;
            }
        }

        const flags = tsType?.flags ?? 0;

        const isString = (flags & ts.TypeFlags.String) !== 0;
        const isNumber = (flags & ts.TypeFlags.Number) !== 0;
        const isBoolean = (flags & ts.TypeFlags.Boolean) !== 0;
        const isVoid = (flags & ts.TypeFlags.Void) !== 0;
        const isNull = (flags & ts.TypeFlags.Null) !== 0;
        const isUndefined = (flags & ts.TypeFlags.Undefined) !== 0;
        const isPrimitive = isString || isNumber || isBoolean;

        const isUnion = ts.isUnionTypeNode(typeNode);

        const isArray = ts.isArrayTypeNode(typeNode);

        const symbol = tsType?.symbol ?? tsType?.aliasSymbol;
        const symbolName = symbol?.getName();
        const symbolFlags = symbol?.flags;

        let declarationKind: string | undefined;
        let isClass = false;
        let isInterface = false;
        let isEnum = false;
        let isTypeAlias = false;
        const declarations = symbol?.declarations;
        if (declarations && declarations.length > 0) {
            const decl = declarations[0];
            declarationKind = ts.SyntaxKind[decl.kind];
            if (ts.isClassDeclaration(decl)) isClass = true;
            else if (ts.isInterfaceDeclaration(decl)) isInterface = true;
            else if (ts.isEnumDeclaration(decl)) isEnum = true;
            else if (ts.isTypeAliasDeclaration(decl)) isTypeAlias = true;
        }

        const isObject =
            !isString &&
            !isNumber &&
            !isBoolean &&
            !isVoid &&
            !isNull &&
            !isUndefined &&
            (flags & ts.TypeFlags.Object) !== 0;

        const kindName = this.classifyKindName({
            isString,
            isNumber,
            isBoolean,
            isVoid,
            isNull,
            isUndefined,
            isArray,
            isUnion,
            isObject,
            symbolName,
            declarationKind,
        });

        let elementKind: ParameterTypeView | undefined;
        if (isArray && ts.isArrayTypeNode(typeNode)) {
            elementKind = this.extract(typeNode.elementType);
        }

        let unionMembers: ParameterTypeView[] = [];
        if (isUnion && ts.isUnionTypeNode(typeNode)) {
            unionMembers = typeNode.types.map(t => this.extract(t));
        }

        return {
            sourceText,
            kindName,
            flags,
            isResolved,
            isString,
            isNumber,
            isBoolean,
            isVoid,
            isNull,
            isUndefined,
            isPrimitive,
            isArray,
            isUnion,
            isObject,
            isClass,
            isInterface,
            isEnum,
            isTypeAlias,
            symbolName,
            symbolFlags,
            declarationKind,
            elementKind,
            unionMembers,
        };
    }

    private empty(sourceText: string): ParameterTypeView {
        return {
            sourceText,
            kindName: "<no-type>",
            flags: 0,
            isResolved: false,
            isString: false,
            isNumber: false,
            isBoolean: false,
            isVoid: false,
            isNull: false,
            isUndefined: false,
            isPrimitive: false,
            isArray: false,
            isUnion: false,
            isObject: false,
            isClass: false,
            isInterface: false,
            isEnum: false,
            isTypeAlias: false,
            symbolName: undefined,
            symbolFlags: undefined,
            declarationKind: undefined,
            elementKind: undefined,
            unionMembers: [],
        };
    }

    private classifyKindName(parts: {
        readonly isString: boolean;
        readonly isNumber: boolean;
        readonly isBoolean: boolean;
        readonly isVoid: boolean;
        readonly isNull: boolean;
        readonly isUndefined: boolean;
        readonly isArray: boolean;
        readonly isUnion: boolean;
        readonly isObject: boolean;
        readonly symbolName: string | undefined;
        readonly declarationKind: string | undefined;
    }): string {
        if (parts.isString) return "string";
        if (parts.isNumber) return "number";
        if (parts.isBoolean) return "boolean";
        if (parts.isVoid) return "void";
        if (parts.isNull) return "null";
        if (parts.isUndefined) return "undefined";
        if (parts.isArray) return "array";
        if (parts.isUnion) return "union";
        if (parts.isObject) {
            return parts.symbolName ?? "object";
        }
        return "unknown";
    }
}