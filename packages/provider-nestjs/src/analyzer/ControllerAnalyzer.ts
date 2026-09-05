import ts from "typescript";
import {
    ClassQuery,
    DeclarationResolver,
    ExpressionInspector,
    SymbolResolver,
} from "@spectra/provider-ast";

import { ControllerMetadata } from "../metadata";
import {
    ControllerPathExtractor,
} from "../semantic/controller-path";
import {
    FilterSourceExtractor,
    GuardSourceExtractor,
    InterceptorSourceExtractor,
    PipeSourceExtractor,
} from "../semantic/decorator-arg";
import { DecoratorArguments, DecoratorReader } from "../utils";

export class ControllerAnalyzer {

    private readonly pathExtractor: ControllerPathExtractor;
    private readonly guardExtractor: GuardSourceExtractor;
    private readonly pipeExtractor: PipeSourceExtractor;
    private readonly interceptorExtractor: InterceptorSourceExtractor;
    private readonly filterExtractor: FilterSourceExtractor;

    public constructor(
        private readonly classQuery: ClassQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        const _decoratorArguments =
            decoratorArguments ?? new DecoratorArguments();
        const _inspector = inspector ?? new ExpressionInspector();
        this.pathExtractor = new ControllerPathExtractor(
            decoratorReader,
            _decoratorArguments,
            _inspector,
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
    }

    public analyze(
        sourceFile: ts.SourceFile,
    ): readonly ControllerMetadata[] {

        const controllers: ControllerMetadata[] = [];

        const classes = this.classQuery.execute(sourceFile);

        for (const classNode of classes) {

            const pathView = this.pathExtractor.extract(classNode);
            if (pathView.expressionKind === "<no-decorator>") {
                continue;
            }

            const classGuards = this.guardExtractor.extract(classNode);
            const classPipes = this.pipeExtractor.extract(classNode);
            const classInterceptors =
                this.interceptorExtractor.extract(classNode);
            const classFilters = this.filterExtractor.extract(classNode);

            controllers.push({
                name: classNode.name?.text ?? "Anonymous",
                path: pathView.normalized,
                sourcePath: pathView.sourceText,
                normalizedPath: pathView.normalized,
                controllerExpressionKind: pathView.expressionKind,
                controllerPathValue: pathView.value,
                classNode,
                tags: [],
                classGuards,
                classPipes,
                classInterceptors,
                classFilters,
                routes: [],
            });

        }

        return controllers;

    }

}