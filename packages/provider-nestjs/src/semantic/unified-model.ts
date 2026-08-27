import ts from "typescript";
import { HttpMethod } from "@spectra/core";

import { ControllerMetadata, RouteMetadata } from "../metadata";
import { ModuleImportEdge, ModuleMetadata } from "./module-source";
import { ControllerAnalyzer } from "../analyzer/ControllerAnalyzer";
import { RouteAnalyzer } from "../analyzer/RouteAnalyzer";
import { ModuleSourceExtractor } from "./module-source";

/**
 * Unified NestJS semantic model (E10).
 *
 * Combines the per-step outputs of E1..E9 into ONE immutable record
 * per NestJS application. This is the contract for any future
 * consumer (document model, OpenAPI generator, Studio, CLI).
 *
 * Purely structural. No decorators / guards / pipes / interceptors /
 * factories / constructors are ever invoked.
 */

/**
 * Per-operation (controller-method-HTTP verb) composite record.
 */
export interface RouteOperation {
    readonly identityKey: string;
    readonly controllerName: string;
    readonly methodName: string;
    readonly controllerNormalizedPath: string;
    readonly controllerSourcePath: string | undefined;

    readonly decoratorName: string;
    readonly decoratorIndex: number;
    readonly httpMethod: HttpMethod;

    readonly routeSourcePath: string | undefined;
    readonly routePathValue: string | undefined;
    readonly routeExpressionKind: string;
    readonly routeNormalizedPath: string;
    readonly isStatic: boolean;
    readonly composedPath: string;

    readonly parameters: RouteMetadata["parameters"];
    readonly guards: RouteMetadata["guards"];
    readonly pipes: RouteMetadata["pipes"];
    readonly interceptors: RouteMetadata["interceptors"];
    readonly filters: RouteMetadata["filters"];
    readonly httpCode: RouteMetadata["httpCode"];
    readonly headers: RouteMetadata["headers"];
    readonly redirect: RouteMetadata["redirect"];

    readonly moduleName: string | undefined;

    readonly classGuards: ControllerMetadata["classGuards"];
    readonly classPipes: ControllerMetadata["classPipes"];
    readonly classInterceptors: ControllerMetadata["classInterceptors"];
    readonly classFilters: ControllerMetadata["classFilters"];
}

export type ControllerModel = Omit<ControllerMetadata, "routes"> & {
    readonly routes: readonly RouteOperation[];
};

export type ModuleModel = Omit<ModuleMetadata, "controllers" | "providers"> & {
    readonly controllers: readonly string[];
    readonly providers: readonly string[];
    readonly controllerClassNames: readonly string[];
    readonly providerClassNames: readonly string[];
};

export interface SpectraSemanticModel {
    readonly version: string;
    readonly builtAt: string;
    readonly modules: readonly ModuleModel[];
    readonly controllers: readonly ControllerModel[];
    readonly operations: readonly RouteOperation[];
    readonly moduleEdges: readonly ModuleImportEdge[];
}

export class UnifiedSemanticExtractor {
    private readonly controllerAnalyzer: ControllerAnalyzer;
    private readonly routeAnalyzer: RouteAnalyzer;
    private readonly moduleExtractor: ModuleSourceExtractor;

    public constructor(
        controllerAnalyzer: ControllerAnalyzer,
        routeAnalyzer: RouteAnalyzer,
        moduleExtractor: ModuleSourceExtractor,
    ) {
        this.controllerAnalyzer = controllerAnalyzer;
        this.routeAnalyzer = routeAnalyzer;
        this.moduleExtractor = moduleExtractor;
    }

    public extract(
        sourceFiles: readonly ts.SourceFile[],
        classQuery: (sf: ts.SourceFile) => readonly ts.ClassDeclaration[],
    ): SpectraSemanticModel {
        const { modules: rawModules, edges } = this.moduleExtractor.extractAll(
            sourceFiles,
            classQuery,
        );
        const controllers: ControllerModel[] = [];
        for (const sf of sourceFiles) {
            for (const c of this.controllerAnalyzer.analyze(sf)) {
                controllers.push(this.composeController(c));
            }
        }
        const moduleByName = new Map<string, ModuleModel>();
        const modules: ModuleModel[] = rawModules.map(m => {
            const wired = this.wireModule(m);
            moduleByName.set(wired.name, wired);
            return wired;
        });
        const ctrlNameToModule = new Map<string, string>();
        for (const mod of modules) {
            for (const cn of mod.controllerClassNames) {
                ctrlNameToModule.set(cn, mod.name);
            }
        }
        const operations: RouteOperation[] = [];
        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {
                operations.push({
                    ...route,
                    moduleName: ctrlNameToModule.get(ctrl.name),
                });
            }
        }
        return {
            version: "1.0.0",
            builtAt: new Date().toISOString(),
            modules,
            controllers,
            operations,
            moduleEdges: edges,
        };
    }

    private composeController(
        controller: ControllerMetadata,
    ): ControllerModel {
        const routes = this.routeAnalyzer.analyze(controller);
        const operationViews: RouteOperation[] = routes.map(r =>
            this.toRouteOperation(controller, r),
        );
        operationViews.sort((a, b) => a.decoratorIndex - b.decoratorIndex);
        return {
            ...controller,
            routes: operationViews,
        };
    }

    private toRouteOperation(
        controller: ControllerMetadata,
        route: RouteMetadata,
    ): RouteOperation {
        return {
            identityKey:
                controller.name +
                "." +
                route.name +
                "#" +
                route.method,
            controllerName: controller.name,
            methodName: route.name,
            controllerNormalizedPath: controller.normalizedPath,
            controllerSourcePath: controller.sourcePath,
            decoratorName: route.decoratorName,
            decoratorIndex: route.decoratorIndex,
            httpMethod: route.method,
            routeSourcePath: route.sourcePath,
            routePathValue: route.routePathValue,
            routeExpressionKind: route.routeExpressionKind,
            routeNormalizedPath: route.normalizedPath,
            isStatic: route.isStatic,
            composedPath: route.composedPath,
            parameters: route.parameters,
            guards: route.guards,
            pipes: route.pipes,
            interceptors: route.interceptors,
            filters: route.filters,
            httpCode: route.httpCode,
            headers: route.headers,
            redirect: route.redirect,
            moduleName: undefined,
            classGuards: controller.classGuards,
            classPipes: controller.classPipes,
            classInterceptors: controller.classInterceptors,
            classFilters: controller.classFilters,
        };
    }

    private wireModule(module: ModuleMetadata): ModuleModel {
        const ctrlNames = new Set<string>();
        const provNames = new Set<string>();
        for (const item of module.controllers) {
            const name =
                item.className ??
                item.resolvedSymbolName ??
                item.sourceText;
            if (name) ctrlNames.add(name);
        }
        for (const item of module.providers) {
            const name =
                item.className ??
                item.resolvedSymbolName ??
                item.sourceText;
            if (name) provNames.add(name);
        }
        return {
            ...module,
            controllers: [...ctrlNames],
            providers: [...provNames],
            controllerClassNames: [...ctrlNames],
            providerClassNames: [...provNames],
        };
    }
}