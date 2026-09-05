import ts from "typescript";
import { ExpressionInspector } from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Structural view of a single HTTP-verb decorator argument
 * (e.g. the `"users/:id"` inside `@Get("users/:id")`).
 *
 * Preserves the raw source text, the ExpressionInspector
 * classification, and (when applicable) the string-literal value
 * alongside a normalized path component.
 */
export interface RoutePathView {
    /** Raw source text of the argument expression, or undefined. */
    readonly sourceText: string | undefined;
    /** ExpressionInspector classification of the argument expression. */
    readonly expressionKind: string;
    /** String-literal value when applicable; otherwise undefined. */
    readonly value: string | undefined;
    /** Normalized path component. Empty string when no string literal. */
    readonly normalized: string;
    /** True when the path is a statically known string literal. */
    readonly isStatic: boolean;
}

/**
 * Extracts a route path argument from an HTTP-verb decorator.
 *
 * The extractor never evaluates the argument; non-string-literal
 * arguments keep their AST source text and expression kind for
 * later semantic consumers.
 */
export class RoutePathExtractor {
    private readonly decoratorArguments: DecoratorArguments;
    private readonly inspector: ExpressionInspector;

    public constructor(
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
    ) {
        this.decoratorArguments = decoratorArguments;
        this.inspector = inspector;
    }

    public extract(decorator: ts.Decorator): RoutePathView {
        const args = this.decoratorArguments.get(decorator);
        if (args.length === 0) {
            return {
                sourceText: undefined,
                expressionKind: "<zero-args>",
                value: undefined,
                normalized: "",
                isStatic: true,
            };
        }
        const arg = args[0];
        const inspected = this.inspector.inspect(arg);
        const value = ts.isStringLiteral(arg) ? arg.text : undefined;
        return {
            sourceText: arg.getText(),
            expressionKind: inspected.kind,
            value,
            normalized: normalizeRoutePath(value ?? ""),
            isStatic: value !== undefined,
        };
    }
}

/**
 * Normalize a path component:
 *   - empty      -> ""
 *   - "/"        -> ""
 *   - "users"    -> "users"
 *   - "/users"   -> "users"
 *   - "users/"   -> "users"
 *   - "/users/"  -> "users"
 *   - "a//b"     -> "a/b"
 *   - "api/v1"   -> "api/v1"
 */
export function normalizeRoutePath(path: string): string {
    return path
        .split("/")
        .filter(s => s.length > 0)
        .join("/");
}