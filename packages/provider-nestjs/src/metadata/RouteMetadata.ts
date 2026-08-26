import ts from "typescript";
import { HttpMethod } from "@spectra/core";
import { ParameterTypeView } from "../semantic/parameter-type";

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

    /**
     * Per-method parameter semantics. Added in E4. Empty for
     * methods that take no parameters.
     */
    readonly parameters: readonly ParameterMetadata[];

    readonly methodNode: ts.MethodDeclaration;

}

/**
 * Per-parameter semantic record (E4).
 *
 * Preserves the parameter name, the parameter decorator (if any),
 * the key argument (with source text + ExpressionInspector
 * classification), and the parameter's TypeScript type text.
 *
 * Source-preservation rules:
 *   - `name` is the parameter identifier text (e.g. "id").
 *   - `decoratorName` is the source-side decorator name (e.g. "Param",
 *     "Query", "Body") when present; undefined otherwise.
 *   - `keySourceText` is the raw argument text (e.g. `"id"`, `id`,
 *     `HttpStatus.OK`); undefined when the decorator has no argument.
 *   - `keyExpressionKind` is the ExpressionInspector classification
 *     of the key argument; undefined when no argument.
 *   - `key` is the string-literal value when applicable; undefined
 *     otherwise. Never coerced from non-string-literal expressions.
 *   - `keyIsStatic` is true only when `key` was a string literal.
 *   - `typeText` is the parameter type's source text.
 */
export interface ParameterMetadata {

    /** Source-order position (0-based) of the parameter. */
    readonly parameterIndex: number;

    /** Parameter identifier name (e.g. "id", "category", "dto"). */
    readonly name: string;

    /** Parameter decorator name (e.g. "Param", "Query", "Body") or undefined. */
    readonly decoratorName: string | undefined;

    /** Decorator index among all decorators on the parameter. */
    readonly decoratorIndex: number;

    /** Raw source text of the key argument, or undefined. */
    readonly keySourceText: string | undefined;

    /** ExpressionInspector classification of the key argument, or undefined. */
    readonly keyExpressionKind: string | undefined;

    /** String-literal value of the key argument when applicable, or undefined. */
    readonly key: string | undefined;

    /** True when the key is a statically-known string literal. */
    readonly keyIsStatic: boolean;

    /** Parameter type's source text (e.g. "string", "number", "CreateUserDto"). */
    readonly typeText: string;

    /**
     * Resolved type semantics (added in E5). Reuses provider-ast's
     * TypeResolver — no second TypeChecker abstraction. Preserves the
     * original source text in `type.sourceText` while surfacing the
     * kind classification, symbol, declaration kind, array / union
     * structure, etc.
     */
    readonly type: ParameterTypeView;

    /** Whether the parameter has any decorator. */
    readonly hasDecorator: boolean;

}