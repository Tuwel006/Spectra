import { HttpMethod } from "@spectra/core";

import { ControllerMetadata, RouteMetadata } from "../metadata";

/**
 * Complete route operation identity view.
 *
 * Combines E1 controller metadata with E2 route metadata into a
 * single immutable record that downstream consumers (E10 unified
 * semantic model, future document model, etc.) can use directly.
 *
 * Identity rules:
 *   - `identityKey` is unique per operation (`Controller.Method#VERB`).
 *   - `pathKey` is NOT unique — two different operations may share
 *     the same composed path (e.g. GET /users/:id vs DELETE /users/:id
 *     vs AdminController GET /users/:id).
 *   - `composedPath` is preserved exactly as computed by E2's
 *     composeRoutePath (no double-slash, root "/" preserved).
 *   - `controllerSourcePath` and `routeSourcePath` are preserved
 *     independently from the normalized / composed paths so source
 *     information is never lost.
 *   - `isStatic` is true only when BOTH the controller path AND the
 *     route path are statically known. Dynamic expressions in
 *     either position make the whole operation dynamic.
 */
export interface RouteOperationIdentity {
    readonly controllerName: string;
    readonly methodName: string;
    readonly decoratorName: string;
    readonly httpMethod: HttpMethod;
    readonly controllerSourcePath: string | undefined;
    readonly controllerNormalizedPath: string;
    readonly routeSourcePath: string | undefined;
    /** ExpressionInspector classification of the route argument. */
    readonly routeExpressionKind: string;
    readonly routeNormalizedPath: string;
    readonly composedPath: string;
    readonly isStatic: boolean;
    /** Unique per operation: `${controllerName}.${methodName}#${httpMethod}`. */
    readonly identityKey: string;
    /** NOT unique — multiple operations may share this key. */
    readonly pathKey: string;
    readonly decoratorIndex: number;
}

/**
 * Builds a complete operation-identity view from one controller +
 * one route. Composes path information from E1 + E2 without any
 * mutation. Never executes user code; never evaluates dynamic
 * expressions into concrete strings.
 */
export class RouteCompositionExtractor {
    public extract(
        controller: ControllerMetadata,
        route: RouteMetadata,
    ): RouteOperationIdentity {
        const controllerIsStatic =
            controller.controllerExpressionKind === "string" ||
            controller.controllerExpressionKind === "<zero-args>";
        const isStatic = controllerIsStatic && route.isStatic;
        const identityKey =
            controller.name + "." + route.name + "#" + route.method;
        return {
            controllerName: controller.name,
            methodName: route.name,
            decoratorName: route.decoratorName,
            httpMethod: route.method,
            controllerSourcePath: controller.sourcePath,
            controllerNormalizedPath: controller.normalizedPath,
            routeSourcePath: route.sourcePath,
            routeExpressionKind: route.routeExpressionKind,
            routeNormalizedPath: route.normalizedPath,
            composedPath: route.composedPath,
            isStatic,
            identityKey,
            pathKey: route.composedPath,
            decoratorIndex: route.decoratorIndex,
        };
    }
}