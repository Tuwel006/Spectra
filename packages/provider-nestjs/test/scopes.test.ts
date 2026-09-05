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

/**
 * D1 audit test — decorator discovery and scope isolation.
 *
 * Verifies the following invariants against the real example-api fixture:
 *   1. Class / method / parameter scopes are queried independently and
 *      NEVER merged.
 *   2. Decorator order within each scope matches source order.
 *   3. Argument counts (0, 1, multiple) are returned correctly per scope.
 *   4. Argument text is preserved verbatim from the AST
 *      (e.g. 'products', HttpStatus.CREATED, JwtAuthGuard).
 */

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

// Deterministic source-file order so output is byte-identical across runs.
const sourceFiles = [...scanner.scan()].sort(
    (a, b) =>
        a.fileName.localeCompare(b.fileName),
);

function printDecoratorList(
    label: string,
    decorators: readonly ts.Decorator[],
) {
    console.log(`Scope: ${label}`);
    if (decorators.length === 0) {
        console.log("  (no decorators)");
        console.log("  Total: 0 decorator(s)");
        return;
    }
    decorators.forEach((decorator, index) => {
        const name = decoratorReader.getName(decorator) ?? "<unnamed>";
        const args = decoratorArguments.get(decorator);
        const argTexts = args.map(arg => arg.getText());
        const paddedIndex = String(index + 1).padStart(2, " ");
        const paddedName = name.padEnd(12, " ");
        console.log(
            `  #${paddedIndex} @${paddedName} [${args.length} args] [${argTexts.join(", ")}]`,
        );
    });
    console.log(
        `  Total: ${decorators.length} decorator(s)`,
    );
}

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);

    // Only consider source files that actually contain a @Controller class
    // (mirrors the filter used in decorator.test.ts).
    const controllerClasses = classes.filter(c =>
        decoratorReader.has(c, "Controller"),
    );
    if (controllerClasses.length === 0) {
        continue;
    }

    console.log(
        "\n============================================================",
    );
    console.log(`File: ${sourceFile.fileName}`);
    console.log(
        "============================================================",
    );

    for (const classNode of controllerClasses) {
        const className =
            classNode.name?.getText() ?? "<anonymous>";

        console.log("");
        printDecoratorList(
            `class | ${className}`,
            decoratorReader.getDecorators(classNode),
        );

        const methods = methodQuery.execute(classNode);
        for (const methodNode of methods) {
            console.log("");
            printDecoratorList(
                `method | ${methodNode.name.getText()}`,
                decoratorReader.getDecorators(methodNode),
            );

            const parameters =
                parameterQuery.execute(methodNode);
            if (parameters.length === 0) {
                console.log("");
                console.log(
                    "Scope: parameter | (no parameters)",
                );
                continue;
            }
            for (const parameterNode of parameters) {
                console.log("");
                printDecoratorList(
                    `parameter | ${parameterNode.name.getText()}`,
                    decoratorReader.getDecorators(parameterNode),
                );
            }
        }
    }
}