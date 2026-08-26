import {
    DecoratorReader,
    DecoratorArguments,
} from "../utils";
import {
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    ParameterQuery,
    SymbolResolver,
    TypeResolver,
    DeclarationResolver,
} from "@spectra/provider-ast";

import { ControllerMetadata, RouteMetadata } from "../metadata";
import { composeRoutePath } from "../semantic/route-composition";
import {
    FilterSourceExtractor,
    GuardSourceExtractor,
    InterceptorSourceExtractor,
    PipeSourceExtractor,
} from "../semantic/decorator-arg";
import { RouteMethodExtractor } from "../semantic/route-method";
import { RoutePathExtractor } from "../semantic/route-path";
import { ParameterSourceExtractor } from "../semantic/parameter-source";
import { ParameterTypeExtractor } from "../semantic/parameter-type";

export class RouteAnalyzer {

    private readonly methodExtractor: RouteMethodExtractor;
    private readonly parameterExtractor: ParameterSourceExtractor;
    private readonly parameterQuery: ParameterQuery;
    private readonly guardExtractor: GuardSourceExtractor;
    private readonly pipeExtractor: PipeSourceExtractor;
    private readonly interceptorExtractor: InterceptorSourceExtractor;
    private readonly filterExtractor: FilterSourceExtractor;

    public constructor(
        private readonly methodQuery: MethodQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
        typeResolver?: TypeResolver,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
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
                new ParameterTypeExtractor(typeResolver),
            );
        this.guardExtractor = new GuardSourceExtractor(
            decoratorReader,
            _decoratorArguments,
            _inspector,
            symbolResolver,
            declarationResolver,
        );
        this.pipeExtractor = new PipeSourceExtractor(
            decoratorReader,
            _decoratorArguments,
            _inspector,
            symbolResolver,
            declarationResolver,
        );
        this.interceptorExtractor = new InterceptorSourceExtractor(
            decoratorReader,
            _decoratorArguments,
            _inspector,
            symbolResolver,
            declarationResolver,
        );
        this.filterExtractor = new FilterSourceExtractor(
            decoratorReader,
            _decoratorArguments,
            _inspector,
            symbolResolver,
            declarationResolver,
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

                const guards = this.guardExtractor.extract(methodNode);
                const pipes = this.pipeExtractor.extract(methodNode);
                const interceptors =
                    this.interceptorExtractor.extract(methodNode);
                const filters = this.filterExtractor.extract(methodNode);

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

                    guards,

                    pipes,

                    interceptors,

                    filters,

                    methodNode,

                });

            }

        }

        return routes;

    }

}