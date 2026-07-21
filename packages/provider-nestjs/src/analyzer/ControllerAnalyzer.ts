import ts from "typescript";
import { ClassQuery } from "@spectra/provider-ast";

import { ControllerMetadata } from "../metadata";
import { DecoratorReader } from "../utils";

export class ControllerAnalyzer {

    public constructor(
        private readonly classQuery: ClassQuery,
        private readonly decoratorReader: DecoratorReader,
    ) { }

    public analyze(
        sourceFile: ts.SourceFile,
    ): readonly ControllerMetadata[] {

        const controllers: ControllerMetadata[] = [];

        const classes = this.classQuery.execute(sourceFile);

        for (const classNode of classes) {

            if (!this.decoratorReader.has(classNode, "Controller")) {
                continue;
            }

            controllers.push({
                name: classNode.name?.text ?? "Anonymous",
                path: "",
                classNode,
                tags: [],
                routes: [],
            });

        }

        return controllers;

    }

}