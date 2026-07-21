import path from "node:path";

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

// IMPORTANT: point to tsconfig.json
const project = new AstProject({
  tsconfigPath: path.resolve(
    process.cwd(),
    "apps/example-api/tsconfig.json",
  ),
});

const scanner = new SourceScanner(project);

const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);

const decoratorReader = new DecoratorReader();

const analyzer = new ControllerAnalyzer(
  classQuery,
  decoratorReader,
);

const sourceFiles = scanner.scan();

for (const sourceFile of sourceFiles) {
  const controllers = analyzer.analyze(sourceFile);

  if (controllers.length > 0) {
    console.log("\\nFile:", sourceFile.fileName);

    for (const controller of controllers) {
      console.log("  Controller:", controller.name);
      console.log("  Path:", controller.path);
    }
  }
}