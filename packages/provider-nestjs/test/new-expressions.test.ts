import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D22 audit test — new expressions.
 *
 * Verifies that ts.NewExpression used as a top-level decorator argument
 * classifies as kind: "new" with callee and constructor arguments
 * preserved structurally. Constructors are NEVER executed.
 *
 * Production change (consolidated in 5d4f147):
 * ExpressionKind union gained "new"; inspect(...) detects
 * ts.isNewExpression.
 */

interface NewView {
    readonly kind: "new";
    readonly sourceText: string;
    readonly expressionText: string;
    readonly argumentCount: number;
    readonly arguments: readonly ExpressionView[];
}
interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly argumentCount: number;
}
interface ElementAccessView {
    readonly kind: "element-access";
    readonly sourceText: string;
    readonly argumentText: string;
}
interface PropertyAccessView {
    readonly kind: "property-access";
    readonly sourceText: string;
    readonly property: string;
}
interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly name: string;
}
interface ArrayView {
    readonly kind: "array";
    readonly sourceText: string;
    readonly itemCount: number;
    readonly items: readonly ExpressionView[];
}
interface ObjectView {
    readonly kind: "object";
    readonly sourceText: string;
}
interface FallbackView {
    readonly kind: "unknown";
    readonly sourceText: string;
    readonly astKind: string;
}
type ExpressionView =
    | NewView
    | CallView
    | ElementAccessView
    | PropertyAccessView
    | IdentifierView
    | ArrayView
    | ObjectView
    | FallbackView;

const inspector = new ExpressionInspector();

function view(arg: ts.Expression): ExpressionView {
    if (ts.isNewExpression(arg)) {
        return {
            kind: "new",
            sourceText: arg.getText(),
            expressionText: arg.expression.getText(),
            argumentCount: arg.arguments?.length ?? 0,
            arguments: (arg.arguments ?? []).map(view),
        };
    }
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            argumentCount: arg.arguments.length,
        };
    }
    if (ts.isElementAccessExpression(arg)) {
        return {
            kind: "element-access",
            sourceText: arg.getText(),
            argumentText: arg.argumentExpression.getText(),
        };
    }
    if (ts.isPropertyAccessExpression(arg)) {
        return {
            kind: "property-access",
            sourceText: arg.getText(),
            property: arg.name.getText(),
        };
    }
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            sourceText: arg.getText(),
            name: arg.text,
        };
    }
    if (ts.isArrayLiteralExpression(arg)) {
        return {
            kind: "array",
            sourceText: arg.getText(),
            itemCount: arg.elements.length,
            items: arg.elements.map(view),
        };
    }
    if (ts.isObjectLiteralExpression(arg)) {
        return {
            kind: "object",
            sourceText: arg.getText(),
        };
    }
    return {
        kind: "unknown",
        sourceText: arg.getText(),
        astKind: ts.SyntaxKind[arg.kind],
    };
}

function printView(v: ExpressionView, indent = "  "): string {
    switch (v.kind) {
        case "new":
            return (
                `kind: new | sourceText: ${v.sourceText} | ` +
                `expression: ${v.expressionText} | ` +
                `argumentCount: ${v.argumentCount}\n` +
                v.arguments
                    .map(
                        (a, i) =>
                            `${indent}args[${i}]: ${printView(a, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "call":
            return `kind: call | sourceText: ${v.sourceText} | argumentCount: ${v.argumentCount}`;
        case "element-access":
            return `kind: element-access | sourceText: ${v.sourceText} | argument: ${v.argumentText}`;
        case "property-access":
            return `kind: property-access | sourceText: ${v.sourceText} | property: ${v.property}`;
        case "identifier":
            return `kind: identifier | sourceText: ${v.sourceText} | name: ${v.name}`;
        case "array":
            return `kind: array | sourceText: ${v.sourceText} | itemCount: ${v.itemCount}`;
        case "object":
            return `kind: object | sourceText: ${v.sourceText}`;
        case "unknown":
            return `kind: unknown | sourceText: ${v.sourceText} | astKind: ${v.astKind}`;
    }
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();

const source = `
class NewForms {
    @Decorator(new Foo())                       m1() {}
    @Decorator(new Foo("x"))                    m2() {}
    @Decorator(new Foo(A, B))                   m3() {}
    @Decorator(new ns.Foo())                    m4() {}
    @Decorator(new Foo()[0])                    m5() {}
    @Decorator(new Foo().value)                 m6() {}
    @Decorator(new Pipe({ whitelist: true }))   m7() {}
    @Decorator([new AuthGuard(), new AdminGuard()]) m8() {}
    @Decorator(new Inner(new Deep()))            m9() {}
}
`;

const file = ts.createSourceFile(
    "synthetic-new.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const cls = file.statements.find(ts.isClassDeclaration);
if (!cls) throw new Error("no class");

console.log("===== D22 — NEW EXPRESSIONS =====\n");
let newCount = 0;
let passCount = 0;

for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        args.forEach((arg, i) => {
            const v = view(arg);
            const ok = v.kind === "new";
            const inspectedKind = inspector.inspect(arg).kind;
            if (v.kind === "new") newCount++;
            if (ok) passCount++;
            console.log(
                `${member.name.getText().padEnd(6)} arg[${i}] ` +
                    `view=${v.kind.padEnd(8)} ` +
                    `inspector=${inspectedKind.padEnd(8)} ` +
                    `${ok ? "PASS" : "FAIL"}`,
            );
        });
    }
}

console.log(
    `\nSummary: ${passCount}/${newCount} new expressions correctly classified`,
);
if (newCount === 0 || passCount !== newCount) process.exit(1);