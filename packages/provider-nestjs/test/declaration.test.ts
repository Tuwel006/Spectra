import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
    DeclarationResolver,
} from "@spectra/provider-ast";

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const scanner =
    new SourceScanner(project);

const walker =
    new NodeWalker();

const classQuery =
    new ClassQuery(walker);

const methodQuery =
    new MethodQuery(walker);

const declarationResolver =
    new DeclarationResolver(project);

const sourceFiles =
    scanner.scan();

for (const sourceFile of sourceFiles) {

    const classes =
        classQuery.execute(sourceFile);

    for (const classNode of classes) {

        const methods =
            methodQuery.execute(classNode);

        for (const methodNode of methods) {

            const decorators =
                ts.getDecorators(methodNode) ?? [];

            for (const decorator of decorators) {

                if (
                    !ts.isCallExpression(
                        decorator.expression,
                    )
                ) {
                    continue;
                }

                for (
                    const argument
                    of decorator.expression.arguments
                ) {

                    if (
                        !ts.isIdentifier(argument)
                    ) {
                        continue;
                    }

                    const declarations =
                        declarationResolver.resolve(
                            argument,
                        );

                    console.log(
                        "\nExpression:",
                        argument.getText(),
                    );

                    for (
                        const declaration
                        of declarations
                    ) {

                        console.log(
                            "Declaration:",
                            ts.SyntaxKind[
                            declaration.kind
                            ],
                        );

                        console.log(
                            "File:",
                            declaration
                                .getSourceFile()
                                .fileName,
                        );

                    }

                    const classDeclaration =
                        declarationResolver.resolveClass(
                            argument,
                        );

                    if (classDeclaration) {

                        console.log(
                            "Resolved as class:",
                            classDeclaration.name
                                ?.getText(),
                        );

                    }

                    const functionDeclaration =
                        declarationResolver.resolveFunction(
                            argument,
                        );

                    if (functionDeclaration) {

                        console.log(
                            "Resolved as function:",
                            functionDeclaration.name
                                ?.getText(),
                        );

                    }

                }

            }

        }

    }

}