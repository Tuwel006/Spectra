import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D29 audit test — spread elements and special AST constructs.
 *
 * Covers:
 *   * SpreadElement inside arrays: [...guards], [a, ...rest, b]
 *   * SpreadElement inside calls: factory(...args)
 *   * SpreadAssignment inside objects: { ...options, key: value }
 *   * ShorthandPropertyAssignment: { enabled } (covered by D15 already)
 *   * ThisExpression / SuperExpression as decorator argument
 *     where syntactically valid
 *
 * SpreadElement itself is preserved structurally inside its parent
 * ArrayLiteralExpression / CallExpression / ObjectLiteralExpression.
 * No flattening happens.
 */

interface ArrayView {
    readonly kind: "array";
    readonly sourceText: string;
    readonly itemCount: number;
    readonly items: readonly ItemView[];
}
interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly argumentCount: number;
    readonly arguments: readonly ItemView[];
}
interface ObjectView {
    readonly kind: "object";
    readonly sourceText: string;
    readonly properties: readonly {
        readonly key: string;
        readonly kind: string;
        readonly text: string;
    }[];
}
interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly name: string;
}
interface SpreadItemView {
    readonly kind: "spread";
    readonly sourceText: string;
    readonly expressionText: string;
}
type ItemView =
    | IdentifierView
    | SpreadItemView
    | { kind: "other"; sourceText: string };

function viewExpression(arg: ts.Expression): ItemView {
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            sourceText: arg.getText(),
            name: arg.text,
        };
    }
    if (
        ts.SyntaxKind[arg.kind] === "SpreadElement" ||
        (arg as any).kind === ts.SyntaxKind.SpreadElement
    ) {
        return {
            kind: "spread",
            sourceText: arg.getText(),
            expressionText: (arg as any).expression?.getText() ?? "<expr>",
        };
    }
    return { kind: "other", sourceText: arg.getText() };
}

function viewArray(arg: ts.ArrayLiteralExpression): ArrayView {
    return {
        kind: "array",
        sourceText: arg.getText(),
        itemCount: arg.elements.length,
        items: arg.elements.map(viewExpression),
    };
}

function viewCall(arg: ts.CallExpression): CallView {
    return {
        kind: "call",
        sourceText: arg.getText(),
        argumentCount: arg.arguments.length,
        arguments: arg.arguments.map(viewExpression),
    };
}

function viewObject(arg: ts.ObjectLiteralExpression): ObjectView {
    return {
        kind: "object",
        sourceText: arg.getText(),
        properties: arg.properties.map(p => {
            if (ts.isSpreadAssignment(p)) {
                return {
                    key: "<spread>",
                    kind: "SpreadElement",
                    text: p.getText(),
                };
            }
            if (ts.isShorthandPropertyAssignment(p)) {
                return {
                    key: p.name.getText(),
                    kind: "ShorthandPropertyAssignment",
                    text: p.getText(),
                };
            }
            if (ts.isPropertyAssignment(p)) {
                return {
                    key: p.name.getText(),
                    kind: "PropertyAssignment",
                    text: p.getText(),
                };
            }
            return {
                key: p.getText(),
                kind: "<unsupported>",
                text: p.getText(),
            };
        }),
    };
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const source = [
    "class SpreadForms {",
    "  @Decorator([...guards])                       s1() {}",
    "  @Decorator([a, ...rest, b])                   s2() {}",
    "  @Decorator(factory(...args))                  s3() {}",
    "  @Decorator(factory(...getArgs()))             s4() {}",
    "  @Decorator({ ...options, key: value })       s5() {}",
    "  @Decorator({ enabled })                      s6() {}",
    "}",
    "class SpecialForms {",
    "  @Decorator(this)                            t1() {}",
    "  @Decorator(super.method)                     t2() {}",
    "}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-spread.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

console.log("===== D29 — SPREAD ELEMENTS + SPECIAL AST =====\n");

let spreadCount = 0;
let spreadPass = 0;
let specialCount = 0;

for (const stmt of file.statements) {
    if (!ts.isClassDeclaration(stmt)) continue;
    const className = stmt.name?.getText() ?? "<anon>";
    for (const member of stmt.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        const methodName = member.name.getText();
        for (const d of decoratorReader.getDecorators(member)) {
            const args = decoratorArguments.get(d);
            args.forEach((arg, i) => {
                const inspected = inspector.inspect(arg);
                console.log(
                    className +
                        "." +
                        methodName +
                        " arg[" +
                        i +
                        "] inspector=" +
                        inspected.kind,
                );
                if (ts.isArrayLiteralExpression(arg)) {
                    const v = viewArray(arg);
                    console.log("    " + v.sourceText);
                    v.items.forEach((it, j) => {
                        console.log(
                            "      items[" +
                                j +
                                "] " +
                                it.kind +
                                " " +
                                it.sourceText,
                        );
                        if (it.kind === "spread") spreadCount++;
                    });
                } else if (ts.isCallExpression(arg)) {
                    const v = viewCall(arg);
                    console.log("    " + v.sourceText);
                    v.arguments.forEach((it, j) => {
                        console.log(
                            "      args[" +
                                j +
                                "] " +
                                it.kind +
                                " " +
                                it.sourceText,
                        );
                        if (it.kind === "spread") spreadCount++;
                    });
                } else if (ts.isObjectLiteralExpression(arg)) {
                    const v = viewObject(arg);
                    console.log("    " + v.sourceText);
                    v.properties.forEach((p, j) => {
                        console.log(
                            "      [" +
                                j +
                                "] " +
                                p.kind +
                                " " +
                                p.text,
                        );
                        if (p.kind === "SpreadElement") spreadCount++;
                    });
                }
                if (
                    methodName.startsWith("s") &&
                    inspected.kind === "array" ||
                    inspected.kind === "call" ||
                    inspected.kind === "object"
                ) {
                    spreadPass++;
                }
                if (methodName.startsWith("t")) specialCount++;
            });
        }
    }
}

console.log("");
console.log(
    "Spread count: " + spreadCount + " | Spread pass: " + spreadPass + " | Special: " + specialCount,
);

if (spreadCount < 4 || spreadPass < 6) {
    // Expect at least 4 spread elements (s1, s2, s3, s4, s5 → 5 spread total)
    // and 6 spreads+non-spread top-level decorators (s1..s6 = 6).
    process.exit(1);
}