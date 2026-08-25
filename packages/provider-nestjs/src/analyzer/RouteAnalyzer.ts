import { ExpressionInspector, MethodQuery } from "@spectra/provider-ast";

import { ControllerMetadata, RouteMetadata } from "../metadata";
import { composeRoutePath } from "../semantic/route-composition";
import { RouteMethodExtractor } from "../semantic/route-method";
import { RoutePathExtractor } from "../semantic/route-path";
import {
    DecoratorArguments,
    DecoratorReader,
} from "../utils";

export class RouteAnalyzer {

    private readonly methodExtractor: RouteMethodExtractor;

    public constructor(
        private readonly methodQuery: MethodQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
        methodExtractor?: RouteMethodExtractor,
    ) {
        this.methodExtractor =
            methodExtractor ??
            new RouteMethodExtractor(
                decoratorReader,
                new RoutePathExtractor(
                    decoratorArguments ?? new DecoratorArguments(),
                    inspector ?? new ExpressionInspector(),
                ),
            );
    }

    public analyze(
        controller: ControllerMetadata,
    ): readonly RouteMetadata[] {

        const routes: RouteMetadata[] = [];

        const methods =
            this.methodQuery.execute(
                controller.classNode,
            );

        for (const methodNode of methods) {

            const views = this.methodExtractor.extract(methodNode);
            if (views.length === 0) {
                continue;
            }

            for (const view of views) {

                const composedPath = composeRoutePath(
                    controller.normalizedPath,
                    view.normalizedPath,
                );

                routes.push({

                    name: methodNode.name.getText(),

                    decoratorName: view.decoratorName,

                    decoratorIndex: view.decoratorIndex,

                    method: view.httpMethod,

                    sourcePath: view.sourcePath,

                    path: view.normalizedPath,

                    normalizedPath: view.normalizedPath,

                    routePathValue: view.value,

                    routeExpressionKind: view.expressionKind,

                    isStatic: view.isStatic,

                    composedPath,

                    methodNode,

                });

            }

        }

        return routes;

    }

}