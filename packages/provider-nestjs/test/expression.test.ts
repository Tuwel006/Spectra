import ts from "typescript";
import { ExpressionInterpreter } from "../src";

const interpreter = new ExpressionInterpreter();

const source = ts.createSourceFile(
    "test.ts",
    `
        const a = "users";
        const b = 201;
        const c = true;
        const d = false;
        const e = null;
        const f = -10;
        const g = HttpStatus.CREATED;
    `,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const variableStatements =
    source.statements.filter(
        ts.isVariableStatement,
    );

for (const statement of variableStatements) {

    const declaration =
        statement.declarationList.declarations[0];

    const name =
        declaration.name.getText();

    const initializer =
        declaration.initializer;

    if (!initializer) {
        continue;
    }

    const value =
        interpreter.evaluate(initializer);

    console.log(
        `${name}:`,
        value,
        "| AST:",
        initializer.getText(),
    );
}