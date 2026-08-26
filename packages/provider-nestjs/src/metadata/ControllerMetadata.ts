import ts from "typescript";
import {
    FilterSourceView,
    GuardSourceView,
    InterceptorSourceView,
    PipeSourceView,
} from "../semantic/decorator-arg";
import { RouteMetadata } from "./RouteMetadata";

export interface ControllerMetadata {

    readonly name: string;

    /**
     * Normalized controller path component (no leading/trailing
     * slashes, no duplicate slashes). Empty string when `@Controller`
     * has no argument.
     */
    readonly path: string;

    /** Raw source text of the `@Controller` argument, or undefined. */
    readonly sourcePath: string | undefined;

    /**
     * Normalized controller path — same as `path` today; will be
     * combined with route paths in E3.
     */
    readonly normalizedPath: string;

    /** ExpressionInspector classification of the `@Controller` argument. */
    readonly controllerExpressionKind: string;

    /** String-literal value of the `@Controller` argument when applicable. */
    readonly controllerPathValue: string | undefined;

    readonly classNode: ts.ClassDeclaration;

    readonly version?: string;

    readonly tags: readonly string[];

    /**
     * Class-scope @UseGuards arguments (added in E6). Each argument
     * is surfaced as a `GuardSourceView` (identifier / call / array /
     * object) with source text and (where applicable) resolved
     * symbol / declaration information. Guards are NEVER invoked.
     */
    readonly classGuards: readonly GuardSourceView[];

    /** Class-scope @UsePipes arguments (added in E7). Same view shape. */
    readonly classPipes: readonly PipeSourceView[];

    /** Class-scope @UseInterceptors arguments (added in E7). */
    readonly classInterceptors: readonly InterceptorSourceView[];

    /** Class-scope @UseFilters arguments (added in E7). */
    readonly classFilters: readonly FilterSourceView[];

    readonly routes: readonly RouteMetadata[];

}