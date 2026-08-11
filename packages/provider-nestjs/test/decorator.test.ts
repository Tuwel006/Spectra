import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
    ParameterQuery,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const scanner = new SourceScanner(project);

const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);
const methodQuery = new MethodQuery(walker);
const parameterQuery = new ParameterQuery(walker);

const decoratorReader = new DecoratorReader();

const decoratorArguments = new DecoratorArguments();

const sourceFiles = scanner.scan();

function printArguments(decorator: ts.Decorator) {
    console.log("Arguments-:")
    for (const arg of decoratorArguments.get(decorator)) {
        console.log("-- : ", arg.getText())
    }
}

for (const sourceFile of sourceFiles) {

    const classes = classQuery.execute(sourceFile);

    for (const classNode of classes) {

        if (!decoratorReader.has(classNode, "Controller")) {
            continue;
        }

        console.log("\n================================");
        console.log(
            `Controller: ${classNode.name?.getText()}`,
        );
        console.log("================================");

        console.log("\nClass decorators:");

        for (
            const decorator
            of decoratorReader.getDecorators(classNode)
        ) {

            console.log(
                `  @${decoratorReader.getName(decorator)}`,
            );
            printArguments(decorator)

        }

        const methods = methodQuery.execute(classNode);

        for (const methodNode of methods) {

            console.log(
                `\nMethod: ${methodNode.name.getText()}`,
            );

            console.log("Method decorators:");

            for (
                const decorator
                of decoratorReader.getDecorators(methodNode)
            ) {

                console.log(
                    `  @${decoratorReader.getName(decorator)}`,
                );
                printArguments(decorator);

            }

            const parameters =
                parameterQuery.execute(methodNode);

            for (const parameterNode of parameters) {

                console.log(
                    `\n  Parameter: ${parameterNode.name.getText()}`,
                );

                console.log(
                    "  Parameter decorators:",
                );

                for (
                    const decorator
                    of decoratorReader.getDecorators(
                        parameterNode,
                    )
                ) {

                    console.log(
                        `    @${decoratorReader.getName(decorator)}`,
                    );
                    printArguments(decorator);

                }

            }

        }

    }

}