import ts from "typescript";
import {
    DeclarationResolver,
    ExpressionInspector,
    SymbolResolver,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Generic structural + semantic view of a single decorator argument.
 *
 * Used for E6 (Guards) and E7 (Pipes / Interceptors / Filters).
 * The semantic MODEL distinguishes between guards, pipes, interceptors,
 * and filters at the metadata level (separate `classGuards` /
 * `classPipes` / `classInterceptors` / `classFilters` and per-route
 * `guards` / `pipes` / `interceptors` / `filters` fields). The view
 * type itself is shared to avoid duplicating identical shape logic.
 *
 * Fields:
 *   - `kindName`: the ExpressionInspector classification
 *     ("identifier", "call", "array", "object", "string",
 *      "property-access", etc.).
 *   - `sourceText`: the raw source text of the argument (preserved
 *     verbatim; NEVER normalized away).
 *   - `isStatic`: true ONLY when the argument is a bare identifier
 *     (and resolves through the SymbolResolver). Calls, arrays,
 *     objects, template literals are NEVER considered static — they
 *     require runtime evaluation.
 *   - `resolvedSymbolName` / `resolvedDeclarationKind`: information
 *     from SymbolResolver + DeclarationResolver when the argument is
 *     an identifier. (Reuses existing provider-ast resolvers; no new
 *     TypeChecker / second SymbolResolver is introduced.)
 *   - `className`: the resolved class name when the identifier
 *     resolves to a ClassDeclaration.
 *   - `children`: nested view for array elements.
 *
 * Never invokes guards / pipes / interceptors / filters. Never reads
 * runtime values.
 */
export interface DecoratorArgView {
    readonly kindName: string;
    readonly sourceText: string | undefined;
    readonly isStatic: boolean;
    readonly resolvedSymbolName: string | undefined;
    readonly resolvedDeclarationKind: string | undefined;
    readonly className: string | undefined;
    readonly children: readonly DecoratorArgView[];
}

// Backward-compat aliases for E6 (kept as explicit semantic names).
export type GuardSourceView = DecoratorArgView;
export type PipeSourceView = DecoratorArgView;
export type InterceptorSourceView = DecoratorArgView;
export type FilterSourceView = DecoratorArgView;

/**
 * Generic decorator-argument extractor.
 *
 * Reads the arguments of a named decorator (`@UseGuards`,
 * `@UsePipes`, `@UseInterceptors`, `@UseFilters`, …) on a class
 * or method declaration and produces one `DecoratorArgView` per
 * argument.
 *
 * Reuses DecoratorReader, DecoratorArguments, ExpressionInspector,
 * SymbolResolver, and DeclarationResolver — no new resolver classes.
 *
 * `SymbolResolver` and `DeclarationResolver` are OPTIONAL. When
 * absent (synthetic in-memory source files), the extractor still
 * produces a structural view with `sourceText`, `kindName`,
 * `isStatic`, and `children` — but no symbol / declaration info.
 */
export class DecoratorArgExtractor {
    private readonly decoratorReader: DecoratorReader;
    private readonly decoratorArguments: DecoratorArguments;
    private readonly inspector: ExpressionInspector;
    private readonly symbolResolver: SymbolResolver | undefined;
    private readonly declarationResolver: DeclarationResolver | undefined;
    private readonly decoratorName: string;

    public constructor(
        decoratorName: string,
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        this.decoratorName = decoratorName;
        this.decoratorReader = decoratorReader;
        this.decoratorArguments = decoratorArguments;
        this.inspector = inspector;
        this.symbolResolver = symbolResolver;
        this.declarationResolver = declarationResolver;
    }

    public extract(
        node: ts.ClassDeclaration | ts.MethodDeclaration,
    ): readonly DecoratorArgView[] {
        const decorators = this.decoratorReader.findAll(node, this.decoratorName);
        if (decorators.length === 0) return [];
        const allArgs = decorators.flatMap(d => this.decoratorArguments.get(d));
        return allArgs.map(a => this.fromExpression(a));
    }

    private fromExpression(expr: ts.Expression): DecoratorArgView {
        const sourceText = expr.getText();
        const inspected = this.inspector.inspect(expr);
        const kindName = inspected.kind;

        if (ts.isIdentifier(expr)) {
            return this.fromIdentifier(expr, sourceText);
        }
        if (
            ts.isStringLiteral(expr) ||
            ts.isNumericLiteral(expr) ||
            expr.kind === ts.SyntaxKind.TrueKeyword ||
            expr.kind === ts.SyntaxKind.FalseKeyword ||
            expr.kind === ts.SyntaxKind.NullKeyword ||
            (ts.isPrefixUnaryExpression(expr) &&
                expr.operator === ts.SyntaxKind.MinusToken &&
                ts.isNumericLiteral(expr.operand))
        ) {
            // Primitives are statically known — no symbol
            // resolution needed.
            return this.make(kindName, sourceText, true, []);
        }
        if (ts.isCallExpression(expr)) {
            return this.fromCallExpression(expr, sourceText);
        }
        if (ts.isPropertyAccessExpression(expr)) {
            return this.fromPropertyAccess(expr, sourceText);
        }
        if (ts.isArrayLiteralExpression(expr)) {
            const children = expr.elements.map(e =>
                this.fromExpression(e),
            );
            return this.make(kindName, sourceText, false, children);
        }
        if (ts.isObjectLiteralExpression(expr)) {
            return this.make(kindName, sourceText, false, []);
        }
        return this.make(kindName, sourceText, false, []);
    }

    private fromIdentifier(
        expr: ts.Identifier,
        sourceText: string,
    ): DecoratorArgView {
        const symbol = this.safeResolveSymbol(expr);
        const declarations = this.safeResolveDeclarations(expr);
        const firstDeclaration = declarations[0];
        const classDecl = this.safeResolveClass(expr);
        return this.make(
            "identifier",
            sourceText,
            true,
            [],
            symbol?.getName(),
            firstDeclaration
                ? ts.SyntaxKind[firstDeclaration.kind]
                : undefined,
            classDecl?.name?.getText(),
        );
    }

    private fromCallExpression(
        expr: ts.CallExpression,
        sourceText: string,
    ): DecoratorArgView {
        const calleeSymbol = this.safeResolveSymbol(expr.expression);
        const calleeDecls = this.safeResolveDeclarations(expr.expression);
        const firstDecl = calleeDecls[0];
        return this.make(
            "call",
            sourceText,
            false,
            [],
            calleeSymbol?.getName(),
            firstDecl ? ts.SyntaxKind[firstDecl.kind] : undefined,
            undefined,
        );
    }

    private fromPropertyAccess(
        expr: ts.PropertyAccessExpression,
        sourceText: string,
    ): DecoratorArgView {
        // Property access is supported structurally: we resolve the
        // property name (e.g. `CREATED` for `HttpStatus.CREATED`) via
        // the SymbolResolver but NEVER evaluate the receiver. isStatic
        // is false because the full semantic value depends on the
        // receiver's runtime state.
        const propertySymbol = this.safeResolveSymbol(expr);
        const declarations = this.safeResolveDeclarations(expr);
        const firstDeclaration = declarations[0];
        return this.make(
            "property-access",
            sourceText,
            false,
            [],
            propertySymbol?.getName(),
            firstDeclaration
                ? ts.SyntaxKind[firstDeclaration.kind]
                : undefined,
            undefined,
        );
    }

    private safeResolveSymbol(node: ts.Node) {
        if (!this.symbolResolver) return undefined;
        try {
            return this.symbolResolver.resolve(node);
        } catch {
            return undefined;
        }
    }

    private safeResolveDeclarations(node: ts.Node): readonly ts.Declaration[] {
        if (!this.declarationResolver) return [];
        try {
            return this.declarationResolver.resolve(node);
        } catch {
            return [];
        }
    }

    private safeResolveClass(node: ts.Node): ts.ClassDeclaration | undefined {
        if (!this.declarationResolver) return undefined;
        try {
            const direct = this.declarationResolver.resolveClass(node);
            if (direct) return direct;
        } catch {
            return undefined;
        }
        try {
            const decls = this.safeResolveDeclarations(node);
            const first = decls[0];
            if (
                first &&
                ts.isImportSpecifier(first) &&
                this.symbolResolver
            ) {
                const aliasedSymbol =
                    this.safeResolveSymbol((first as ts.ImportSpecifier)
                        .parent.parent.parent);
                if (aliasedSymbol) {
                    return this.declarationResolver.resolveClass(
                        aliasedSymbol.declarations?.[0] ?? node,
                    );
                }
            }
        } catch {
            return undefined;
        }
        return undefined;
    }

    private make(
        kindName: string,
        sourceText: string | undefined,
        isStatic: boolean,
        children: readonly DecoratorArgView[],
        resolvedSymbolName?: string,
        resolvedDeclarationKind?: string,
        className?: string,
    ): DecoratorArgView {
        return {
            kindName,
            sourceText,
            isStatic,
            resolvedSymbolName,
            resolvedDeclarationKind,
            className,
            children,
        };
    }
}

// Backward-compat alias for E6 (kept as explicit semantic name).
export class GuardSourceExtractor extends DecoratorArgExtractor {
    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        super(
            "UseGuards",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
    }
}

// Convenience factory aliases for E7 — explicit semantic names.
export class PipeSourceExtractor extends DecoratorArgExtractor {
    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        super(
            "UsePipes",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
    }
}

export class InterceptorSourceExtractor extends DecoratorArgExtractor {
    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        super(
            "UseInterceptors",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
    }
}

export class FilterSourceExtractor extends DecoratorArgExtractor {
    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        super(
            "UseFilters",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
    }
}