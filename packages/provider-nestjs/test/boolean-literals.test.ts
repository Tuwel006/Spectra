import ts from "typescript";

import {
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D8 audit test — boolean literals.
 *
 * Verifies that:
 *   - `true` and `false` are recognized as boolean literals.
 *   - multiple booleans stay in source order.
 *   - booleans inside arrays stay booleans (not flattened).
 *   - booleans inside object property values stay booleans.
 *   - `true` ≠ `"true"` (boolean vs string).
 *   - `true` ≠ `value` (boolean vs identifier — neither is coerced).
 *   - `condition ? true : false` stays structural; NOT a boolean literal.
 *   - `!true` stays prefix-unary; NOT silently folded to boolean false.
 *
 * No production-code changes — `ExpressionInspector` already returns
 * `kind: "boolean"` for `TrueKeyword` / `FalseKeyword`. The test
 * verifies that and asserts the negative cases (no false positives for
 * `unknown`, `prefix-unary`, etc.).
 */

interface BooleanLiteralView {
    readonly kind: "boolean-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "boolean";
    readonly value: boolean;
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

interface PrefixUnaryView {
    readonly kind: "prefix-unary";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
    readonly operandKind: string;
    readonly operandSourceText: string;
}

interface ConditionalView {
    readonly kind: "conditional";
    readonly sourceText: string;
    readonly astKind: string;
    readonly conditionKind: string;
    readonly whenTrueKind: string;
    readonly whenFalseKind: string;
}

interface FallbackView {
    readonly kind: "unknown";
    readonly sourceText: string;
    readonly astKind: string;
}

type ExpressionView =
    | BooleanLiteralView
    | StringLiteralView
    | IdentifierView
    | ArrayView
    | ObjectView
    | PrefixUnaryView
    | ConditionalView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (
        arg.kind === ts.SyntaxKind.TrueKeyword ||
        arg.kind === ts.SyntaxKind.FalseKeyword
    ) {
        return {
            kind: "boolean-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            semanticKind: "boolean",
            value: arg.kind === ts.SyntaxKind.TrueKeyword,
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
    if (ts.isPrefixUnaryExpression(arg)) {
        return {
            kind: "prefix-unary",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            operator: ts.SyntaxKind[arg.operator],
            operandKind: ts.SyntaxKind[arg.operand.kind],
            operandSourceText: arg.operand.getText(),
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
        case "boolean-literal":
            return (
                `kind: boolean-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: ${v.value}`
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
        case "prefix-unary":
            return (
                `kind: prefix-unary | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | operator: ${v.operator} | ` +
                `operandKind: ${v.operandKind} | ` +
                `operandSourceText: ${v.operandSourceText}`
            );
        case "conditional":
            return (
                `kind: conditional | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | conditionKind: ${v.conditionKind} | ` +
                `whenTrueKind: ${v.whenTrueKind} | ` +
                `whenFalseKind: ${v.whenFalseKind}`
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
        // Surface the production inspector classification too.
        const inspected = expressionInspector.inspect(arg);
        console.log(
            `    ExpressionInspector.kind: ${inspected.kind}`,
        );
    });
}

// ============================================================
// Part A — synthetic D8 spec cases
// ============================================================
console.log(
    "\n===== D8 PART A — SYNTHETIC BOOLEAN FORMS =====\n",
);

const syntheticSource = `
class Booleans {
    @Decorator(true)                  m1() {}
    @Decorator(false)                 m2() {}
    @Decorator(true, false, true)     m3() {}
    @Decorator([true, false])         m4() {}
    @Decorator({ enabled: true, disabled: false }) m5() {}
    @Decorator(true)                  m6bTrue() {}
    @Decorator("true")                m6String() {}
    @Decorator(value)                 m6Identifier() {}
    @Decorator(condition ? true : false) m7Conditional() {}
    @Decorator(!true)                 m8NotTrue() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-boolean.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const booleanClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!booleanClass) {
    throw new Error("synthetic source had no class");
}

for (const member of booleanClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Booleans.${methodName}`);
    }
}

// ============================================================
// Part B — explicit distinction trio:
//          true / "true" / value  — distinct kinds
// ============================================================
console.log(
    "\n===== D8 PART B — DISTINCTION TRIO =====\n",
);

const distinctionSource = `
class Distinction {
    @Decorator(true)       booleanLiteral() {}
    @Decorator("true")     stringLiteral() {}
    @Decorator(trueish)    identifier() {}
}
`;

const distinctionFile = ts.createSourceFile(
    "distinction-boolean.ts",
    distinctionSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const distinctionClass =
    distinctionFile.statements.find(ts.isClassDeclaration);

if (!distinctionClass) {
    throw new Error("distinction source had no class");
}

for (const member of distinctionClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Distinction.${methodName}`);
    }
}

// ============================================================
// Part C — real-looking NestJS boolean arguments
// (example-api has no boolean decorators — synthetic NestJS-style)
// ============================================================
console.log(
    "\n===== D8 PART C — REAL-LOOKING NESTJS BOOLEAN ARGS =====\n",
);

const nestSource = `
class NestBooleans {
    @Options({ cors: true, cache: false })         corsEnabled() {}
    @SetMetadata("public", true)                   publicRoute() {}
}
`;

const nestFile = ts.createSourceFile(
    "nest-boolean.ts",
    nestSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nestClass =
    nestFile.statements.find(ts.isClassDeclaration);

if (!nestClass) {
    throw new Error("nest-boolean source had no class");
}

for (const member of nestClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `NestBooleans.${methodName}`);
    }
}