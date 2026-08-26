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
import { GuardSourceExtractor } from "../semantic/guard-source";
import { DecoratorArguments, DecoratorReader } from "../utils";

export class ControllerAnalyzer {

    private readonly pathExtractor: ControllerPathExtractor;
    private readonly guardExtractor: GuardSourceExtractor;

    public constructor(
        private readonly classQuery: ClassQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        this.pathExtractor = new ControllerPathExtractor(
            decoratorReader,
            decoratorArguments ??
                new DecoratorArguments(),
            inspector ?? new ExpressionInspector(),
        );
        this.guardExtractor = new GuardSourceExtractor(
            decoratorReader,
            decoratorArguments ??
                new DecoratorArguments(),
            inspector ?? new ExpressionInspector(),
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
                routes: [],
            });

        }

        return controllers;

    }

}