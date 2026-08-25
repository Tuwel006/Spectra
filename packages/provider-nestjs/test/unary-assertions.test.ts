import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D25 + D26 + D27 audit test — prefix-unary, postfix-unary, and
 * type-assertion / non-null expressions.
 *
 * D25 — prefix-unary full coverage (D7 only had `-numeric`):
 *   !value, ~value, +value, -value, typeof value, void value,
 *   delete value, ++value, --value.
 *
 * D26 — postfix: value++, value--.
 *
 * D27 — type assertions: value as T, value! (non-null).
 *
 * Production change (consolidated in 5d4f147):
 * ExpressionKind gained "postfix-unary" and "as-expression";
 * inspect(...) detects ts.isPostfixUnaryExpression,
 * ts.isAsExpression, ts.isTypeAssertionExpression,
 * ts.isNonNullExpression.
 *
 * NOTE: D7 already established that `-(numeric)` classifies as
 * "prefix-unary". Other prefix-unary forms fall into the generic
 * "unknown" bucket (this D25 documents the gap; the D7 fix was
 * the smallest generic fix that captured -10 safely without conflating
 * it with a NumericLiteral).
 */

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const source = [
    "class UnaryForms {",
    "  @Decorator(!value) u1() {}",
    "  @Decorator(~value) u2() {}",
    "  @Decorator(+value) u3() {}",
    "  @Decorator(-value) u4() {}",
    "  @Decorator(typeof value) u5() {}",
    "  @Decorator(void value) u6() {}",
    "  @Decorator(delete obj.prop) u7() {}",
    "  @Decorator(++value) u8() {}",
    "  @Decorator(--value) u9() {}",
    "  @Decorator(value++) p1() {}",
    "  @Decorator(value--) p2() {}",
    "  @Decorator(value as string) a1() {}",
    "  @Decorator(value as SomeType) a2() {}",
    "  @Decorator(value!) a3() {}",
    "}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-unary.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const cls = file.statements.find(ts.isClassDeclaration);
if (!cls) throw new Error("no class");

console.log("===== D25 — PREFIX-UNARY =====\n");
console.log("===== D26 — POSTFIX-UNARY =====\n");
console.log("===== D27 — AS-EXPRESSIONS =====\n");

let postfixCount = 0;
let postfixPass = 0;
let asExprCount = 0;
let asExprPass = 0;

for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        args.forEach((arg, i) => {
            const inspected = inspector.inspect(arg);
            const text = arg.getText();

            if (methodName.startsWith("p")) {
                postfixCount++;
                const ok = inspected.kind === "postfix-unary";
                if (ok) postfixPass++;
                console.log(
                    methodName +
                        " arg[" +
                        i +
                        "] " +
                        (ok ? "PASS" : "FAIL") +
                        " (inspector=" +
                        inspected.kind +
                        ", text=" +
                        JSON.stringify(text) +
                        ")",
                );
            } else if (methodName.startsWith("a")) {
                asExprCount++;
                const ok = inspected.kind === "as-expression";
                if (ok) asExprPass++;
                console.log(
                    methodName +
                        " arg[" +
                        i +
                        "] " +
                        (ok ? "PASS" : "FAIL") +
                        " (inspector=" +
                        inspected.kind +
                        ", text=" +
                        JSON.stringify(text) +
                        ")",
                );
            } else {
                // D25 prefix-unary: log inspector result for completeness.
                const opName =
                    ts.isPrefixUnaryExpression(arg)
                        ? ts.SyntaxKind[arg.operator]
                        : "<not-prefix-unary>";
                console.log(
                    methodName +
                        " arg[" +
                        i +
                        "] (inspector=" +
                        inspected.kind +
                        ", op=" +
                        opName +
                        ", text=" +
                        JSON.stringify(text) +
                        ")",
                );
            }
        });
    }
}

console.log("");
console.log(
    "Summary: D26 postfix-unary " +
        postfixPass +
        "/" +
        postfixCount +
        " | D27 as-expression " +
        asExprPass +
        "/" +
        asExprCount,
);
console.log(
    "Note: D25 prefix-unary results above include 'unknown' for !, ~, +, typeof, etc.",
);
console.log(
    "Only `-(numeric)` is mapped to 'prefix-unary' (D7); the remaining operators",
);
console.log("fall through to 'unknown' as documented in D0.");

if (postfixPass !== postfixCount || asExprPass !== asExprCount) {
    process.exit(1);
}