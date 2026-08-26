import {
    DecoratorReader,
    DecoratorArguments,
} from "../utils";
import {
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    ParameterQuery,
} from "@spectra/provider-ast";

import { ControllerMetadata, RouteMetadata } from "../metadata";
import { composeRoutePath } from "../semantic/route-composition";
import { RouteMethodExtractor } from "../semantic/route-method";
import { RoutePathExtractor } from "../semantic/route-path";
import { ParameterSourceExtractor } from "../semantic/parameter-source";

export class RouteAnalyzer {

    private readonly methodExtractor: RouteMethodExtractor;
    private readonly parameterExtractor: ParameterSourceExtractor;
    private readonly parameterQuery: ParameterQuery;

    public constructor(
        private readonly methodQuery: MethodQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
        methodExtractor?: RouteMethodExtractor,
        parameterExtractor?: ParameterSourceExtractor,
    ) {
        const _decoratorArguments =
            decoratorArguments ?? new DecoratorArguments();
        const _inspector = inspector ?? new ExpressionInspector();
        this.methodExtractor =
            methodExtractor ??
            new RouteMethodExtractor(
                decoratorReader,
                new RoutePathExtractor(
                    _decoratorArguments,
                    _inspector,
                ),
            );
        this.parameterExtractor =
            parameterExtractor ??
            new ParameterSourceExtractor(
                decoratorReader,
                _decoratorArguments,
                _inspector,
            );
        this.parameterQuery = new ParameterQuery(
            new NodeWalker(),
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

                const parameters = this.parameterQuery
                    .execute(methodNode)
                    .map((p, i) =>
                        this.parameterExtractor.extract(p, i),
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

                    parameters,

                    methodNode,

                });

            }

        }

        return routes;

    }

}