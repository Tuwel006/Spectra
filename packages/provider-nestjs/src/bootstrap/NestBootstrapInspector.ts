import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import ts from "typescript";

import type { AstProject } from "@spectra/provider-ast";

/**
 * NestJS-specific bootstrap inspector.
 *
 * Reads the bootstrap entry point (`src/main.ts` by default) and the
 * root module (`src/app.module.ts` by default) to discover runtime
 * configuration that is not available through static analysis of the
 * rest of the application:
 *
 *   - `NestFactory.create(Module)`     → bootstrap module name
 *   - `app.listen(PORT_EXPR)`          → listening port expression
 *
 * The port expression is preserved verbatim when it is not a static
 * literal. When the developer writes
 *
 * ```ts
 * await app.listen(process.env.PORT ?? 3000);
 * ```
 *
 * the inspector records the static fallback (`3000`) alongside the
 * full source text so that downstream layers can decide whether to
 * render one or both. We never invent a port we did not see.
 *
 * This layer lives in `provider-nestjs` because the patterns it
 * recognizes (`NestFactory.create(...)`, `NestFactory.createMicroservice(...)`)
 * are Nest-specific. A Fastify / Express inspector would look for
 * `app.listen(port)` directly — same shape, different package.
 */
export interface NestBootstrapInspection {
    readonly projectRoot: string;

    /**
     * Absolute path of the bootstrap entry point file that was
     * analyzed, or `undefined` if it could not be located.
     */
    readonly bootstrapEntryPath: string | undefined;

    /**
     * Absolute path of the root module file that was analyzed, or
     * `undefined` if it could not be located.
     */
    readonly rootModulePath: string | undefined;

    /**
     * Name of the class passed to `NestFactory.create(...)`, e.g.
     * `"AppModule"`. `undefined` if it could not be statically
     * determined.
     */
    readonly bootstrapModuleName: string | undefined;

    /**
     * Raw source text of the bootstrap entry file, useful for
     * debugging and for downstream generators that want to surface
     * the developer-authored configuration.
     */
    readonly bootstrapEntrySource: string | undefined;

    /**
     * Listening-port description. `undefined` if `main.ts` could not
     * be parsed or no `listen` call was found.
     */
    readonly port: NestBootstrapPort | undefined;
}

export interface NestBootstrapPort {
    /** Static integer if a numeric literal or env-fallback literal
     *  was found (e.g. `3000` or `process.env.PORT ?? 3000`).
     *  `undefined` for purely dynamic expressions. */
    readonly staticFallback: number | undefined;

    /** Full source text of the listen() argument. */
    readonly sourceText: string;

    /** AST classification of the listen() argument. */
    readonly expressionKind:
        | "number-literal"
        | "string-literal"
        | "identifier"
        | "property-access"
        | "binary"
        | "call"
        | "other";

    /** Whether the listen() argument was a static literal. */
    readonly isStatic: boolean;
}

export class NestBootstrapInspector {
    private readonly bootstrapEntryRel: string;
    private readonly rootModuleRel: string;

    public constructor(
        options: {
            bootstrapEntryRel?: string;
            rootModuleRel?: string;
        } = {},
    ) {
        this.bootstrapEntryRel = options.bootstrapEntryRel ?? "src/main.ts";
        this.rootModuleRel = options.rootModuleRel ?? "src/app.module.ts";
    }

    /**
     * Analyze the bootstrap files for a NestJS application rooted at
     * `projectRoot`. The `astProject` argument is reused so that the
     * underlying TypeScript program is shared with the rest of the
     * pipeline (no duplicate compilation).
     */
    public inspect(
        projectRoot: string,
        astProject: AstProject,
    ): NestBootstrapInspection {
        const absoluteRoot = path.resolve(projectRoot);
        const bootstrapEntryPath = this.resolve(
            absoluteRoot,
            this.bootstrapEntryRel,
        );
        const rootModulePath = this.resolve(
            absoluteRoot,
            this.rootModuleRel,
        );

        const sourceFiles = astProject.getSourceFiles();
        const sourceFileByName = new Map<string, ts.SourceFile>();
        for (const sf of sourceFiles) {
            sourceFileByName.set(path.resolve(sf.fileName), sf);
        }

        const bootstrapSourceFile = bootstrapEntryPath
            ? sourceFileByName.get(bootstrapEntryPath)
            : undefined;

        const port = bootstrapSourceFile
            ? this.findPort(bootstrapSourceFile)
            : undefined;
        const bootstrapModuleName = bootstrapSourceFile
            ? this.findNestFactoryModule(bootstrapSourceFile)
            : undefined;
        const bootstrapEntrySource = bootstrapEntryPath
            ? this.readIfExists(bootstrapEntryPath)
            : undefined;

        return {
            projectRoot: absoluteRoot,
            bootstrapEntryPath,
            rootModulePath,
            bootstrapModuleName,
            bootstrapEntrySource,
            port,
        };
    }

    private resolve(projectRoot: string, rel: string): string | undefined {
        const candidate = path.join(projectRoot, rel);
        return existsSync(candidate) ? candidate : undefined;
    }

    private readIfExists(filePath: string): string | undefined {
        try {
            return readFileSync(filePath, "utf-8");
        } catch {
            return undefined;
        }
    }

    /**
     * Locate the `NestFactory.create(...)` invocation inside the
     * bootstrap entry and extract the first argument as a class
     * identifier. We deliberately do not execute the decorator or
     * resolve the module — we only read the AST literal that the
     * developer wrote.
     */
    private findNestFactoryModule(
        sourceFile: ts.SourceFile,
    ): string | undefined {
        let result: string | undefined;

        const visit = (node: ts.Node): void => {
            if (result !== undefined) return;

            if (
                ts.isCallExpression(node) &&
                ts.isPropertyAccessExpression(node.expression) &&
                ts.isIdentifier(node.expression.expression) &&
                node.expression.expression.text === "NestFactory" &&
                node.expression.name.text === "create"
            ) {
                const arg = node.arguments[0];
                if (arg && ts.isIdentifier(arg)) {
                    result = arg.text;
                    return;
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
        return result;
    }

    /**
     * Locate the listening port. Searches for an expression statement
     * of the shape `app.listen(EXPR)` and classifies EXPR. When EXPR
     * contains a `??` (nullish coalescing) with a numeric literal as
     * the right-hand side (the standard Node convention for env
     * fallbacks), the literal is recorded as the static fallback.
     */
    private findPort(
        sourceFile: ts.SourceFile,
    ): NestBootstrapPort | undefined {
        let result: NestBootstrapPort | undefined;

        const visit = (node: ts.Node): void => {
            if (result !== undefined) return;

            const callExpression = this.unwrapToCallExpression(node);
            if (
                callExpression !== undefined &&
                ts.isPropertyAccessExpression(callExpression.expression) &&
                ts.isIdentifier(callExpression.expression.expression) &&
                callExpression.expression.name.text === "listen"
            ) {
                const arg = callExpression.arguments[0];
                if (arg) {
                    result = this.classifyPort(arg);
                }
                return;
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);
        return result;
    }

    /**
     * Unwrap `await EXPR` and `EXPR;` (parenthesized, expression
     * statement) to recover the inner `CallExpression`. Bootstrap
     * code is conventionally written as
     *
     * ```ts
     * await app.listen(port);
     * ```
     *
     * which parses as `ExpressionStatement(AwaitExpression(CallExpression))`.
     */
    private unwrapToCallExpression(
        node: ts.Node,
    ): ts.CallExpression | undefined {
        if (ts.isCallExpression(node)) return node;
        if (
            ts.isExpressionStatement(node) ||
            ts.isParenthesizedExpression(node)
        ) {
            return this.unwrapToCallExpression(node.expression);
        }
        if (ts.isAwaitExpression(node) || ts.isAsExpression(node)) {
            return this.unwrapToCallExpression(node.expression);
        }
        return undefined;
    }

    private classifyPort(node: ts.Expression): NestBootstrapPort {
        const sourceText = node.getText();

        if (ts.isNumericLiteral(node)) {
            return {
                staticFallback: Number(node.text),
                sourceText,
                expressionKind: "number-literal",
                isStatic: true,
            };
        }

        if (
            ts.isBinaryExpression(node) &&
            node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken
        ) {
            const rhs = node.right;
            if (ts.isNumericLiteral(rhs)) {
                return {
                    staticFallback: Number(rhs.text),
                    sourceText,
                    expressionKind: "binary",
                    isStatic: false,
                };
            }
        }

        if (ts.isIdentifier(node)) {
            return {
                staticFallback: undefined,
                sourceText,
                expressionKind: "identifier",
                isStatic: false,
            };
        }

        if (ts.isPropertyAccessExpression(node)) {
            return {
                staticFallback: undefined,
                sourceText,
                expressionKind: "property-access",
                isStatic: false,
            };
        }

        if (ts.isStringLiteral(node)) {
            return {
                staticFallback: undefined,
                sourceText,
                expressionKind: "string-literal",
                isStatic: true,
            };
        }

        return {
            staticFallback: undefined,
            sourceText,
            expressionKind: "other",
            isStatic: false,
        };
    }
}