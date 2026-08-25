import ts from "typescript";

import {
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D12 audit test — element-access expressions.
 *
 * Verifies that `ts.ElementAccessExpression` (e.g. `namespace["x"]`,
 * `values[0]`, `values[key]`) is now classified by `ExpressionInspector`
 * as `kind: "element-access"` (was a documented D0/D10/D11 gap).
 *
 * The new branch lives in `provider-ast` (`ExpressionInspector`) — no
 * NestJS semantics are introduced.
 */

interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly name: string;
}

interface PropertyAccessView {
    readonly kind: "property-access";
    readonly sourceText: string;
    readonly objectText: string;
    readonly property: string;
}

interface ElementAccessView {
    readonly kind: "element-access";
    readonly sourceText: string;
    readonly astKind: string;
    readonly objectKind: string;
    readonly objectText: string;
    readonly argumentKind: string;
    readonly argumentText: string;
}

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly callee: string;
    readonly argumentCount: number;
}

interface StringLiteralView {
    readonly kind: "string-literal";
    readonly sourceText: string;
    readonly value: string;
}

interface NumberLiteralView {
    readonly kind: "number-literal";
    readonly sourceText: string;
    readonly value: number;
}

interface BinaryView {
    readonly kind: "binary";
    readonly sourceText: string;
    readonly operator: string;
}

interface ConditionalView {
    readonly kind: "conditional";
    readonly sourceText: string;
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
    readonly properties: ReadonlyArray<{
        readonly key: string;
        readonly valueKind: string;
        readonly value: ExpressionView;
    }>;
}

interface FallbackView {
    readonly kind: "unknown";
    readonly sourceText: string;
    readonly astKind: string;
}

type ExpressionView =
    | IdentifierView
    | PropertyAccessView
    | ElementAccessView
    | CallView
    | StringLiteralView
    | NumberLiteralView
    | BinaryView
    | ConditionalView
    | ArrayView
    | ObjectView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            sourceText: arg.getText(),
            name: arg.text,
        };
    }
    if (ts.isPropertyAccessExpression(arg)) {
        return {
            kind: "property-access",
            sourceText: arg.getText(),
            objectText: arg.expression.getText(),
            property: arg.name.getText(),
        };
    }
    if (ts.isElementAccessExpression(arg)) {
        return {
            kind: "element-access",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            objectKind: ts.SyntaxKind[arg.expression.kind],
            objectText: arg.expression.getText(),
            argumentKind: ts.SyntaxKind[
                arg.argumentExpression.kind
            ],
            argumentText: arg.argumentExpression.getText(),
        };
    }
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            callee: arg.expression.getText(),
            argumentCount: arg.arguments.length,
        };
    }
    if (ts.isStringLiteral(arg)) {
        return {
            kind: "string-literal",
            sourceText: arg.getText(),
            value: arg.text,
        };
    }
    if (ts.isNumericLiteral(arg)) {
        return {
            kind: "number-literal",
            sourceText: arg.getText(),
            value: Number(arg.text),
        };
    }
    if (ts.isBinaryExpression(arg)) {
        return {
            kind: "binary",
            sourceText: arg.getText(),
            operator: ts.SyntaxKind[arg.operatorToken.kind],
        };
    }
    if (ts.isConditionalExpression(arg)) {
        return {
            kind: "conditional",
            sourceText: arg.getText(),
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
            properties: arg.properties.map(p => {
                if (ts.isPropertyAssignment(p)) {
                    return {
                        key: p.name.getText(),
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
    return {
        kind: "unknown",
        sourceText: arg.getText(),
        astKind: ts.SyntaxKind[arg.kind],
    };
}

function printView(v: ExpressionView, indent: string = "  "): string {
    switch (v.kind) {
        case "identifier":
            return `kind: identifier | sourceText: ${v.sourceText} | name: ${v.name}`;
        case "property-access":
            return (
                `kind: property-access | sourceText: ${v.sourceText} | ` +
                `object: ${v.objectText} | property: ${v.property}`
            );
        case "element-access":
            return (
                `kind: element-access | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | objectKind: ${v.objectKind} | ` +
                `objectText: ${v.objectText} | ` +
                `argumentKind: ${v.argumentKind} | ` +
                `argumentText: ${v.argumentText}`
            );
        case "call":
            return (
                `kind: call | sourceText: ${v.sourceText} | ` +
                `callee: ${v.callee} | argumentCount: ${v.argumentCount}`
            );
        case "string-literal":
            return (
                `kind: string-literal | sourceText: ${v.sourceText} | ` +
                `value: ${JSON.stringify(v.value)}`
            );
        case "number-literal":
            return (
                `kind: number-literal | sourceText: ${v.sourceText} | ` +
                `value: ${v.value}`
            );
        case "binary":
            return (
                `kind: binary | sourceText: ${v.sourceText} | ` +
                `operator: ${v.operator}`
            );
        case "conditional":
            return `kind: conditional | sourceText: ${v.sourceText}`;
        case "array":
            return (
                `kind: array | sourceText: ${v.sourceText} | ` +
                `itemCount: ${v.itemCount}\n` +
                v.items
                    .map((item, i) =>
                        `${indent}items[${i}]: ${printView(item, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "object":
            return (
                `kind: object | sourceText: ${v.sourceText}\n` +
                v.properties
                    .map(p =>
                        `${indent}${p.key} → ${p.valueKind}\n` +
                        `${indent}  ${printView(p.value, indent + "  ")}`,
                    )
                    .join("\n")
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
        console.log(`  argument[${i}]: ${printView(v)}`);
        const inspected = expressionInspector.inspect(arg);
        console.log(
            `    ExpressionInspector.kind: ${inspected.kind}`,
        );
    });
}

// ============================================================
// Part A — synthetic element-access forms
// ============================================================
console.log(
    "\n===== D12 PART A — SYNTHETIC ELEMENT-ACCESS FORMS =====\n",
);

const syntheticSource = `
class ElementAccess {
    @Decorator(namespace["AuthGuard"])              m1() {}
    @Decorator(values["key"])                       m2() {}
    @Decorator(values[0])                           m3() {}
    @Decorator(values[key])                         m4() {}
    @Decorator(values[getKey()])                    m5() {}
    @Decorator(namespace.Auth["Guard"])             m6() {}
    @Decorator(namespace["Auth"]["Guard"])          m7() {}
    @Decorator([values["a"], values[0]])            m8() {}
    @Decorator({ guard: guards["Auth"], status: statuses[201] }) m9() {}
    @Decorator(values[key]())                       m10() {}
    @Decorator(values[1 + 2])                       m11() {}
    @Decorator(values[condition ? "a" : "b"])       m12() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-element-access.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const elementClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!elementClass) {
    throw new Error("synthetic source had no class");
}

for (const member of elementClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `ElementAccess.${methodName}`);
    }
}

// ============================================================
// Part B — critical boundary comparisons
// ============================================================
console.log(
    "\n===== D12 PART B — BOUNDARY COMPARISONS =====\n",
);

const boundarySource = `
class Boundaries {
    @Decorator(namespace.AuthGuard)     dotForm() {}
    @Decorator(namespace["AuthGuard"])  bracketForm() {}
    @Decorator(values)                  identifierOnly() {}
    @Decorator(values[key])             elementAccess() {}
    @Decorator(values[key]())          elementCall() {}
    @Decorator("values")                stringLiteral() {}
}
`;

const boundaryFile = ts.createSourceFile(
    "boundary-element.ts",
    boundarySource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const boundaryClass =
    boundaryFile.statements.find(ts.isClassDeclaration);

if (!boundaryClass) {
    throw new Error("boundary source had no class");
}

for (const member of boundaryClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Boundaries.${methodName}`);
    }
}