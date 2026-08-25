import ts from "typescript";
import { HttpMethod } from "@spectra/core";

export interface RouteMetadata {

    readonly name: string;

    /** Source-side decorator name (e.g. "Get", "Post"). */
    readonly decoratorName: string;

    /**
     * Position of the HTTP-verb decorator among ALL decorators on
     * the method (0-based). Preserved for source-order fidelity.
     */
    readonly decoratorIndex: number;

    /** Normalized HTTP method (HttpMethod enum). */
    readonly method: HttpMethod;

    /** Raw source text of the route argument expression. */
    readonly sourcePath: string | undefined;

    /**
     * Normalized method path component (E1 rule: no leading/trailing
     * slashes, no duplicate slashes). Empty string when no argument
     * or when the argument is not a string literal.
     */
    readonly path: string;

    /**
     * Same as `path` today; kept as an explicit semantic field so
     * future consumers can distinguish it from `sourcePath`.
     */
    readonly normalizedPath: string;

    /** String-literal value of the route argument when applicable. */
    readonly routePathValue: string | undefined;

    /** ExpressionInspector classification of the route argument. */
    readonly routeExpressionKind: string;

    /**
     * True when the route path is a statically-known string literal.
     * False for identifier / property-access / call / template / etc.
     */
    readonly isStatic: boolean;

    /**
     * Final composed route path (controller path + method path).
     * Preserved independently of `sourcePath` so the source AST is
     * never silently lost.
     */
    readonly composedPath: string;

    readonly methodNode: ts.MethodDeclaration;

}