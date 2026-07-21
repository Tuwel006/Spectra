import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
} from "@spectra/provider-ast";

import {
    ControllerAnalyzer,
    DecoratorReader,
} from "../src";

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.build.json",
    ),
});

const scanner = new SourceScanner(project);

const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);

const decoratorReader =
    new DecoratorReader();

const analyzer =
    new ControllerAnalyzer(
        classQuery,
        decoratorReader,
    );

const sourceFiles =
    scanner.scan();

for (const sourceFile of sourceFiles) {

    const controllers =
        analyzer.analyze(sourceFile);

    console.log(
        sourceFile.fileName,
    );

    console.dir(
        controllers,
        {
            depth: null,
        },
    );

}