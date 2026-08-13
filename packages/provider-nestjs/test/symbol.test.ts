import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    SymbolResolver,
} from "@spectra/provider-ast";

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const scanner = new SourceScanner(project);

const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);

const symbolResolver =
    new SymbolResolver(project);

const sourceFiles = scanner.scan();

for (const sourceFile of sourceFiles) {

    const classes =
        classQuery.execute(sourceFile);

    for (const classNode of classes) {

        const decorators =
            ts.getDecorators(classNode) ?? [];

        for (const decorator of decorators) {

            const expression =
                decorator.expression;

            if (!ts.isCallExpression(expression)) {
                continue;
            }

            for (const argument of expression.arguments) {

                if (!ts.isIdentifier(argument)) {
                    continue;
                }

                const symbol =
                    symbolResolver.resolve(argument);

                console.log(
                    "\nExpression:",
                    argument.getText(),
                );

                console.log(
                    "Symbol:",
                    symbol?.getName(),
                );

                console.log(
                    "Declarations:",
                );

                for (
                    const declaration
                    of symbol?.declarations ?? []
                ) {

                    console.log(
                        "  Kind:",
                        ts.SyntaxKind[
                        declaration.kind
                        ],
                    );

                    console.log(
                        "  File:",
                        declaration.getSourceFile()
                            .fileName,
                    );

                    console.log(
                        "  Text:",
                        declaration.getText()
                            .slice(0, 150),
                    );

                }

            }

        }

    }

}