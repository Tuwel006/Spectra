import ts from "typescript";
import {
    ExpressionInspector,
} from "../src";

const inspector =
    new ExpressionInspector();

const source = ts.createSourceFile(
    "test.ts",
    String.raw`
        const a = "users";

        const b = 201;

        const c = true;

        const d = null;

        const e = AuthGuard;

        const f = HttpStatus.CREATED;

        const g = createGuard();

        const h = MyClass.someMethod;

        const i = {
            role: "admin"
        };

        const j = ["admin", "user"];

        const k = value => value.trim();

        const l = function(value) {
            return value.trim();
        };

        const m = -10;

        const n = values["key"];

        const p = "users/" + "x";

        const q = /abc/;

        const r = new Foo();

        const s = cond ? a : b;

        const t = "a" + "b";

        const u = value++;

        const v = value as string;

        const w = [...guards];

        const x = typeof value;
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

    const result =
        inspector.inspect(initializer);

    console.log(
        `${name}:`,
        result.kind,
        "| AST:",
        initializer.getText(),
    );
}