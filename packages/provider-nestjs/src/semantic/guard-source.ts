import ts from "typescript";
import {
    DeclarationResolver,
    ExpressionInspector,
    SymbolResolver,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Structural + semantic view of a single @UseGuards argument (E6).
 *
 * Combines:
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
 *   - `children`: nested GuardSourceView for array elements.
 *
 * Never invokes guards, never reads runtime values.
 */
export interface GuardSourceView {
    readonly kindName: string;
    readonly sourceText: string | undefined;
    readonly isStatic: boolean;
    readonly resolvedSymbolName: string | undefined;
    readonly resolvedDeclarationKind: string | undefined;
    readonly className: string | undefined;
    readonly children: readonly GuardSourceView[];
}

/**
 * Extracts GuardSourceView records for every @UseGuards argument on
 * a class or method declaration.
 *
 * Reuses DecoratorReader, DecoratorArguments, ExpressionInspector,
 * SymbolResolver, and DeclarationResolver — no new resolver classes.
 */
export class GuardSourceExtractor {
    private readonly decoratorReader: DecoratorReader;
    private readonly decoratorArguments: DecoratorArguments;
    private readonly inspector: ExpressionInspector;
    private readonly symbolResolver: SymbolResolver | undefined;
    private readonly declarationResolver: DeclarationResolver | undefined;

    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        this.decoratorReader = decoratorReader;
        this.decoratorArguments = decoratorArguments;
        this.inspector = inspector;
        this.symbolResolver = symbolResolver;
        this.declarationResolver = declarationResolver;
    }

    public extract(
        node: ts.ClassDeclaration | ts.MethodDeclaration,
    ): readonly GuardSourceView[] {
        const decorator = this.decoratorReader.find(node, "UseGuards");
        if (!decorator) return [];
        const args = this.decoratorArguments.get(decorator);
        return args.map(a => this.fromExpression(a));
    }

    private fromExpression(expr: ts.Expression): GuardSourceView {
        const sourceText = expr.getText();
        const inspected = this.inspector.inspect(expr);
        const kindName = inspected.kind;

        if (ts.isIdentifier(expr)) {
            return this.fromIdentifier(expr, sourceText);
        }
        if (ts.isCallExpression(expr)) {
            return this.fromCallExpression(expr, sourceText);
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
    ): GuardSourceView {
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
    ): GuardSourceView {
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
        // Follow import alias: if the first declaration is an
        // ImportSpecifier, look up the original symbol.
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
        children: readonly GuardSourceView[],
        resolvedSymbolName?: string,
        resolvedDeclarationKind?: string,
        className?: string,
    ): GuardSourceView {
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