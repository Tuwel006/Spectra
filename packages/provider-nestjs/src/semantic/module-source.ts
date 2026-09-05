import ts from "typescript";
import {
    DeclarationResolver,
    ExpressionInspector,
    SymbolResolver,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Structural + semantic view of a single `@Module({...})` argument
 * entry (one element of `imports` / `controllers` / `providers` /
 * `exports`).
 *
 * Captures:
 *   - `kindName`: ExpressionInspector classification
 *     ("identifier", "call", "object", "string", etc.).
 *   - `sourceText`: raw argument source text (preserved verbatim).
 *   - `isStatic`: true ONLY for bare identifier items (and other
 *     syntactically resolvable forms). Calls, objects, dynamic
 *     expressions are NEVER considered static.
 *   - `resolvedSymbolName` / `resolvedDeclarationKind`: from
 *     SymbolResolver + DeclarationResolver when the item is an
 *     identifier or property access.
 *   - `className`: resolved class name when the symbol resolves
 *     to a ClassDeclaration.
 *   - `providerForm`: for object-literal provider forms, the
 *     detected provider strategy ("useClass" / "useValue" /
 *     "useFactory" / "useExisting"); undefined otherwise.
 *   - `children`: nested ModuleItemView for object/array elements.
 *
 * Never invokes factories, never instantiates modules/providers/
 * controllers, never evaluates runtime values.
 */
export interface ModuleItemView {
    readonly kindName: string;
    readonly sourceText: string | undefined;
    readonly isStatic: boolean;
    readonly resolvedSymbolName: string | undefined;
    readonly resolvedDeclarationKind: string | undefined;
    readonly className: string | undefined;
    readonly providerForm: string | undefined;
    readonly children: readonly ModuleItemView[];
}

/**
 * Per-module semantic record (E9).
 */
export interface ModuleMetadata {
    /** Class declaration name (e.g. "AppModule"). */
    readonly name: string;
    readonly classNode: ts.ClassDeclaration;

    /** Each entry of `@Module({imports: [...]})`. */
    readonly imports: readonly ModuleItemView[];

    /** Each entry of `@Module({controllers: [...]})`. */
    readonly controllers: readonly ModuleItemView[];

    /** Each entry of `@Module({providers: [...]})`. */
    readonly providers: readonly ModuleItemView[];

    /** Each entry of `@Module({exports: [...]})`. */
    readonly exports: readonly ModuleItemView[];
}

/**
 * Edge representing one `@Module({imports: [SomeModule]})` entry.
 * Used by E10 to wire parent → child module relationships.
 */
export interface ModuleImportEdge {
    readonly fromModuleName: string;
    readonly toModuleName: string | undefined;
    readonly item: ModuleItemView;
}

/**
 * Extracts a single `@Module({...})` decorator argument.
 * Reuses DecoratorReader, DecoratorArguments, ExpressionInspector,
 * SymbolResolver, DeclarationResolver.
 */
export class ModuleSourceExtractor {
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
        classNode: ts.ClassDeclaration,
    ): ModuleMetadata {
        const decorator = this.decoratorReader.find(classNode, "Module");
        if (!decorator) {
            return this.emptyMetadata(classNode);
        }
        const args = this.decoratorArguments.get(decorator);
        if (args.length === 0) {
            return this.emptyMetadata(classNode);
        }
        const arg = args[0];
        if (!ts.isObjectLiteralExpression(arg)) {
            // Dynamic @Module arg — preserve structure only.
            return this.emptyMetadata(classNode);
        }

        const imports = this.readPropertyArray(arg, "imports");
        const controllers = this.readPropertyArray(arg, "controllers");
        const providers = this.readPropertyArray(arg, "providers");
        const exports = this.readPropertyArray(arg, "exports");

        return {
            name: classNode.name?.text ?? "Anonymous",
            classNode,
            imports,
            controllers,
            providers,
            exports,
        };
    }

    public extractAll(
        sourceFiles: readonly ts.SourceFile[],
        classQuery: (sf: ts.SourceFile) => readonly ts.ClassDeclaration[],
    ): {
        readonly modules: readonly ModuleMetadata[];
        readonly edges: readonly ModuleImportEdge[];
    } {
        const modules: ModuleMetadata[] = [];
        for (const sf of sourceFiles) {
            for (const cls of classQuery(sf)) {
                const m = this.extract(cls);
                // Skip classes without a meaningful @Module decorator
                // (i.e. no decorators parsed). An empty extract() output
                // would otherwise pollute the unified model with bare
                // class declarations.
                if (
                    m.imports.length === 0 &&
                    m.controllers.length === 0 &&
                    m.providers.length === 0 &&
                    m.exports.length === 0
                ) {
                    continue;
                }
                modules.push(m);
            }
        }
        const edges: ModuleImportEdge[] = [];
        for (const m of modules) {
            for (const item of m.imports) {
                edges.push({
                    fromModuleName: m.name,
                    toModuleName:
                        item.className ?? item.resolvedSymbolName,
                    item,
                });
            }
        }
        return { modules, edges };
    }

    private emptyMetadata(
        classNode: ts.ClassDeclaration,
    ): ModuleMetadata {
        return {
            name: classNode.name?.text ?? "Anonymous",
            classNode,
            imports: [],
            controllers: [],
            providers: [],
            exports: [],
        };
    }

    private readPropertyArray(
        obj: ts.ObjectLiteralExpression,
        propName: string,
    ): readonly ModuleItemView[] {
        const prop = obj.properties.find(
            (p): p is ts.PropertyAssignment =>
                ts.isPropertyAssignment(p) &&
                p.name.getText() === propName,
        );
        if (!prop) return [];
        const initializer = prop.initializer;
        if (!ts.isArrayLiteralExpression(initializer)) {
            // e.g. `imports: someVar` or `imports: someCall()`
            return [this.fromExpression(initializer)];
        }
        return initializer.elements.map(e => this.fromExpression(e));
    }

    private fromExpression(expr: ts.Expression): ModuleItemView {
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
            expr.kind === ts.SyntaxKind.NullKeyword
        ) {
            return this.make(kindName, sourceText, true);
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
            return this.make("array", sourceText, false, children);
        }
        if (ts.isObjectLiteralExpression(expr)) {
            return this.fromProviderObject(expr, sourceText);
        }
        return this.make(kindName, sourceText, false, []);
    }

    private fromIdentifier(
        expr: ts.Identifier,
        sourceText: string,
    ): ModuleItemView {
        const symbol = this.safeResolveSymbol(expr);
        const declarations = this.safeResolveDeclarations(expr);
        const firstDeclaration = declarations[0];
        const classDecl = this.safeResolveClass(expr);
        return this.make(
            "identifier",
            sourceText,
            true,
            undefined,
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
    ): ModuleItemView {
        const calleeSymbol = this.safeResolveSymbol(expr.expression);
        const calleeDecls = this.safeResolveDeclarations(expr.expression);
        const firstDecl = calleeDecls[0];
        return this.make(
            "call",
            sourceText,
            false,
            undefined,
            calleeSymbol?.getName(),
            firstDecl ? ts.SyntaxKind[firstDecl.kind] : undefined,
            undefined,
        );
    }

    private fromPropertyAccess(
        expr: ts.PropertyAccessExpression,
        sourceText: string,
    ): ModuleItemView {
        const propertySymbol = this.safeResolveSymbol(expr);
        const declarations = this.safeResolveDeclarations(expr);
        const firstDeclaration = declarations[0];
        return this.make(
            "property-access",
            sourceText,
            false,
            undefined,
            propertySymbol?.getName(),
            firstDeclaration
                ? ts.SyntaxKind[firstDeclaration.kind]
                : undefined,
            undefined,
        );
    }

    private fromProviderObject(
        expr: ts.ObjectLiteralExpression,
        sourceText: string,
    ): ModuleItemView {
        let providerForm: string | undefined;
        for (const p of expr.properties) {
            if (ts.isPropertyAssignment(p)) {
                providerForm = p.name.getText();
                break;
            }
        }
        const children: ModuleItemView[] = expr.properties.map(p => {
            if (ts.isPropertyAssignment(p)) {
                return {
                    kindName: p.name.getText(),
                    sourceText: p.initializer.getText(),
                    isStatic: false,
                    resolvedSymbolName: undefined,
                    resolvedDeclarationKind: undefined,
                    className: undefined,
                    providerForm: undefined,
                    children: [],
                };
            }
            return this.make("unknown", p.getText(), false, []);
        });
        return this.make("object", sourceText, false, children, undefined, undefined, undefined, providerForm);
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
        // Try import-alias follow-through for completeness (the
        // symbol is shared with module-source but the import-alias
        // walk below uses parent.parent.parent which may not always
        // be the import declaration's source file).
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
        children: readonly ModuleItemView[] = [],
        resolvedSymbolName?: string,
        resolvedDeclarationKind?: string,
        className?: string,
        providerForm?: string,
    ): ModuleItemView {
        return {
            kindName,
            sourceText,
            isStatic,
            resolvedSymbolName,
            resolvedDeclarationKind,
            className,
            providerForm,
            children,
        };
    }
}