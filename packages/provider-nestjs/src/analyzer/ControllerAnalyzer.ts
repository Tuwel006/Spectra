import ts from "typescript";
import { ClassQuery, ExpressionInspector } from "@spectra/provider-ast";

import { ControllerMetadata } from "../metadata";
import {
    ControllerPathExtractor,
} from "../semantic/controller-path";
import { DecoratorArguments, DecoratorReader } from "../utils";

export class ControllerAnalyzer {

    private readonly pathExtractor: ControllerPathExtractor;

    public constructor(
        private readonly classQuery: ClassQuery,
        decoratorReader: DecoratorReader,
        decoratorArguments?: DecoratorArguments,
        inspector?: ExpressionInspector,
    ) {
        this.pathExtractor = new ControllerPathExtractor(
            decoratorReader,
            decoratorArguments ??
                new DecoratorArguments(),
            inspector ?? new ExpressionInspector(),
        );
        // Keep the existing constructor signature compatible; the
        // optional args allow callers (and tests) to inject the
        // dependencies while existing code paths continue to work.
        void this.classQuery;
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

            controllers.push({
                name: classNode.name?.text ?? "Anonymous",
                path: pathView.normalized,
                sourcePath: pathView.sourceText,
                normalizedPath: pathView.normalized,
                controllerExpressionKind: pathView.expressionKind,
                controllerPathValue: pathView.value,
                classNode,
                tags: [],
                routes: [],
            });

        }

        return controllers;

    }

}