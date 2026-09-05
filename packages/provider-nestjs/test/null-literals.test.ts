import ts from "typescript";

import {
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D9 audit test — null literals.
 *
 * Verifies that `null` is recognized as a literal value and is **not**
 * confused with zero arguments, undefined, the string "null", an
 * identifier named "nullValue", an omitted property, or an array/object
 * containing null.
 *
 * No production-code change is needed — `ExpressionInspector` already
 * classifies `ts.SyntaxKind.NullKeyword` as `kind: "null"`.
 */

interface NullLiteralView {
    readonly kind: "null-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "null";
    readonly value: null;
}

interface StringLiteralView {
    readonly kind: "string-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "string";
    readonly value: string;
}

interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly astKind: string;
    readonly name: string;
}

interface ArrayView {
    readonly kind: "array";
    readonly sourceText: string;
    readonly astKind: string;
    readonly itemCount: number;
    readonly items: readonly ExpressionView[];
}

interface ObjectView {
    readonly kind: "object";
    readonly sourceText: string;
    readonly astKind: string;
    readonly properties: ReadonlyArray<{
        readonly key: string;
        readonly valueKind: string;
        readonly value: ExpressionView;
    }>;
}

interface ConditionalView {
    readonly kind: "conditional";
    readonly sourceText: string;
    readonly astKind: string;
    readonly conditionKind: string;
    readonly whenTrueKind: string;
    readonly whenFalseKind: string;
    readonly whenTrue: ExpressionView;
    readonly whenFalse: ExpressionView;
}

interface BinaryView {
    readonly kind: "binary";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
}

interface FallbackView {
    readonly kind: "unknown";
    readonly sourceText: string;
    readonly astKind: string;
}

type ExpressionView =
    | NullLiteralView
    | StringLiteralView
    | IdentifierView
    | ArrayView
    | ObjectView
    | ConditionalView
    | BinaryView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (arg.kind === ts.SyntaxKind.NullKeyword) {
        return {
            kind: "null-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            semanticKind: "null",
            value: null,
        };
    }
    if (ts.isStringLiteral(arg)) {
        return {
            kind: "string-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            semanticKind: "string",
            value: arg.text,
        };
    }
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            name: arg.text,
        };
    }
    if (ts.isArrayLiteralExpression(arg)) {
        return {
            kind: "array",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            itemCount: arg.elements.length,
            items: arg.elements.map(view),
        };
    }
    if (ts.isObjectLiteralExpression(arg)) {
        return {
            kind: "object",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            properties: arg.properties.map(p => {
                if (ts.isPropertyAssignment(p)) {
                    const key = p.name.getText();
                    return {
                        key,
                        valueKind: ts.SyntaxKind[p.initializer.kind],
                        value: view(p.initializer),
                    };
                }
                return {
                    key: p.getText(),
                    valueKind: "non-assignment",
                    value: {
                        kind: "unknown",
                        sourceText: p.getText(),
                        astKind: ts.SyntaxKind[p.kind],
                    },
                };
            }),
        };
    }
    if (ts.isConditionalExpression(arg)) {
        return {
            kind: "conditional",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            conditionKind: ts.SyntaxKind[arg.condition.kind],
            whenTrueKind: ts.SyntaxKind[arg.whenTrue.kind],
            whenFalseKind: ts.SyntaxKind[arg.whenFalse.kind],
            whenTrue: view(arg.whenTrue),
            whenFalse: view(arg.whenFalse),
        };
    }
    if (ts.isBinaryExpression(arg)) {
        return {
            kind: "binary",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            operator: ts.SyntaxKind[arg.operatorToken.kind],
        };
    }
    return {
        kind: "unknown",
        sourceText: arg.getText(),
        astKind: ts.SyntaxKind[arg.kind],
    };
}

function printView(v: ExpressionView, indent: string = "    "): string {
    switch (v.kind) {
        case "null-literal":
            return (
                `kind: null-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: null`
            );
        case "string-literal":
            return (
                `kind: string-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: ${JSON.stringify(v.value)}`
            );
        case "identifier":
            return (
                `kind: identifier | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | name: ${v.name}`
            );
        case "array":
            return (
                `kind: array | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | itemCount: ${v.itemCount}\n` +
                v.items
                    .map((item, i) =>
                        `${indent}items[${i}]: ${printView(item, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "object":
            return (
                `kind: object | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind}\n` +
                v.properties
                    .map(p =>
                        `${indent}${p.key} → ${p.valueKind}\n` +
                        `${indent}  ${printView(p.value, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "conditional":
            return (
                `kind: conditional | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind}\n` +
                `${indent}condition: ${v.conditionKind}\n` +
                `${indent}whenTrue: ${v.whenTrueKind}\n` +
                `${indent}  ${printView(v.whenTrue, indent + "  ")}\n` +
                `${indent}whenFalse: ${v.whenFalseKind}\n` +
                `${indent}  ${printView(v.whenFalse, indent + "  ")}`
            );
        case "binary":
            return (
                `kind: binary | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | operator: ${v.operator}`
            );
        case "unknown":
            return (
                `kind: unknown | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind}`
            );
    }
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const expressionInspector = new ExpressionInspector();

function printDecorator(
    decorator: ts.Decorator,
    context: string,
) {
    const args = decoratorArguments.get(decorator);
    const name = decoratorReader.getName(decorator) ?? "<unnamed>";
    console.log(`--- ${context} ---`);
    console.log(`Decorator: @${name}(...)`);
    console.log(`  argumentCount: ${args.length}`);
    args.forEach((arg, i) => {
        const v = view(arg);
        console.log(`  argument[${i}]:`);
        console.log(`    ${printView(v, "    ")}`);
        // Surface production inspector classification.
        const inspected = expressionInspector.inspect(arg);
        console.log(
            `    ExpressionInspector.kind: ${inspected.kind}`,
        );
    });
}

// ============================================================
// Part A — synthetic D9 spec cases
// ============================================================
console.log(
    "\n===== D9 PART A — SYNTHETIC NULL FORMS =====\n",
);

const syntheticSource = `
class Nulls {
    @Decorator(null)                        m1() {}
    @Decorator("null")                      m2() {}
    @Decorator(nullValue)                   m3() {}
    @Decorator(null, null, "x")             m4() {}
    @Decorator([null, "x", null])           m5() {}
    @Decorator({ value: null, name: "test" }) m6() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-null.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nullClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!nullClass) {
    throw new Error("synthetic source had no class");
}

for (const member of nullClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Nulls.${methodName}`);
    }
}

// ============================================================
// Part B — critical direct comparison:
//          @Decorator() (0 args) vs @Decorator(null) (1 arg)
// ============================================================
console.log(
    "\n===== D9 PART B — ZERO-ARG vs NULL-ARG =====\n",
);

const criticalSource = `
class Critical {
    @Decorator()      zeroArg() {}
    @Decorator(null)  nullArg() {}
}
`;

const criticalFile = ts.createSourceFile(
    "critical-null.ts",
    criticalSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const criticalClass =
    criticalFile.statements.find(ts.isClassDeclaration);

if (!criticalClass) {
    throw new Error("critical source had no class");
}

for (const member of criticalClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Critical.${methodName}`);
    }
}

// ============================================================
// Part C — nested null structures (object containing object,
//          object containing array of nulls, array containing
//          nested array of nulls)
// ============================================================
console.log(
    "\n===== D9 PART C — NESTED NULL STRUCTURES =====\n",
);

const nestedSource = `
class NestedNull {
    @Decorator({
        config: { value: null },
        values: [null, [null]],
    }) m1() {}

    @Decorator(value ?? null) m2() {}
    @Decorator(null ?? value) m3() {}
}
`;

const nestedFile = ts.createSourceFile(
    "nested-null.ts",
    nestedSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nestedClass =
    nestedFile.statements.find(ts.isClassDeclaration);

if (!nestedClass) {
    throw new Error("nested source had no class");
}

for (const member of nestedClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `NestedNull.${methodName}`);
    }
}

// ============================================================
// Part D — null in conditional branches (NOT collapsed to null)
// ============================================================
console.log(
    "\n===== D9 PART D — NULL IN CONDITIONAL =====\n",
);

const conditionalSource = `
class ConditionalNull {
    @Decorator(condition ? null : "value") m1() {}
    @Decorator(condition ? "value" : null) m2() {}
}
`;

const conditionalFile = ts.createSourceFile(
    "conditional-null.ts",
    conditionalSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const conditionalClass =
    conditionalFile.statements.find(ts.isClassDeclaration);

if (!conditionalClass) {
    throw new Error("conditional source had no class");
}

for (const member of conditionalClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `ConditionalNull.${methodName}`);
    }
}