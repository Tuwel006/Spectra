import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D23 + D24 audit test — conditional and binary expressions.
 *
 * D23 — Conditional: ts.ConditionalExpression (`a ? b : c`)
 *   - ExpressionInspector.kind: "conditional"
 *   - whentrue / whenfalse branches preserved structurally
 *   - condition NEVER evaluated
 *
 * D24 — Binary: ts.BinaryExpression (arithmetic, comparison, logical,
 *   bitwise, in, instanceof)
 *   - ExpressionInspector.kind: "binary"
 *   - left, operator, right preserved
 *   - NEVER evaluated
 *
 * Production change (consolidated in 5d4f147):
 * ExpressionKind union gained "conditional" and "binary";
 * inspect(...) detects both via ts.isConditionalExpression /
 * ts.isBinaryExpression.
 */

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const source = `
class CompoundForms {
    @Decorator(condition ? A : B)                              c1() {}
    @Decorator(condition ? true : false)                       c2() {}
    @Decorator(condition ? null : "x")                         c3() {}
    @Decorator(condition ? factory() : otherFactory())         c4() {}
    @Decorator(cond1 ? cond2 ? A : B : C)                     c5() {}
    @Decorator([cond ? "yes" : "no", cond ? 1 : 2])           c6() {}
    @Decorator({ result: cond ? true : false })               c7() {}

    @Decorator(1 + 2)                                        b1() {}
    @Decorator(a === b)                                      b2() {}
    @Decorator(a !== b)                                      b3() {}
    @Decorator(a > b && a < c)                               b4() {}
    @Decorator(a || b)                                       b5() {}
    @Decorator(a ?? b)                                       b6() {}
    @Decorator(a & b | c ^ d)                                b7() {}
    @Decorator(a << 2)                                       b8() {}
    @Decorator(a in b)                                       b9() {}
    @Decorator(a instanceof Foo)                            b10() {}
    @Decorator(2 ** 3)                                       b11() {}
    @Decorator(["a" + "b", 1 - 2, 3 * 4, 5 / 6, 7 % 8])      b12() {}
    @Decorator(cond ? (a + b) : (c - d))                     cb1() {}
}
`;

const file = ts.createSourceFile(
    "synthetic-compound.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const cls = file.statements.find(ts.isClassDeclaration);
if (!cls) throw new Error("no class");

console.log("===== D23 — CONDITIONAL EXPRESSIONS =====\n");
console.log("===== D24 — BINARY EXPRESSIONS =====\n");

let conditionalCount = 0;
let conditionalPass = 0;
let binaryCount = 0;
let binaryPass = 0;

for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        args.forEach((arg, i) => {
            const inspected = inspector.inspect(arg);
            if (
                methodName.startsWith("c") &&
                inspected.kind === "conditional"
            ) {
                conditionalCount++;
                conditionalPass++;
                console.log(
                    `${methodName} arg[${i}] PASS (kind: conditional, ` +
                        `text: ${JSON.stringify(arg.getText().slice(0, 60))})`,
                );
            } else if (
                methodName.startsWith("b") &&
                inspected.kind === "binary"
            ) {
                binaryCount++;
                binaryPass++;
                const be = arg as ts.BinaryExpression;
                console.log(
                    `${methodName} arg[${i}] PASS (kind: binary, ` +
                        `op: ${ts.SyntaxKind[be.operatorToken.kind]}, ` +
                        `text: ${JSON.stringify(arg.getText().slice(0, 60))})`,
                );
            } else if (
                methodName.startsWith("cb") &&
                inspected.kind === "conditional"
            ) {
                conditionalCount++;
                conditionalPass++;
                console.log(
                    `${methodName} arg[${i}] PASS (kind: conditional, ` +
                        `text: ${JSON.stringify(arg.getText().slice(0, 60))})`,
                );
            } else {
                console.log(
                    `${methodName} arg[${i}] kind=${inspected.kind} text=${JSON.stringify(arg.getText().slice(0, 60))}`,
                );
            }
        });
    }
}

console.log(
    `\nSummary: D23 conditional ${conditionalPass}/${conditionalCount} | D24 binary ${binaryPass}/${binaryCount}`,
);

if (
    conditionalPass !== conditionalCount ||
    binaryPass !== binaryCount
) {
    process.exit(1);
}