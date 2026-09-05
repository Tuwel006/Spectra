import ts from "typescript";

import {
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D14 audit test — array expressions.
 *
 * Verifies that `ts.ArrayLiteralExpression` used as a top-level decorator
 * argument is correctly classified as `kind: "array"` and that nested
 * array elements are surfaced structurally — never evaluated, never
 * flattened into the top-level decorator argument count.
 *
 * No production-code changes — `ExpressionInspector` already returns
 * `kind: "array"` for `ts.isArrayLiteralExpression`.
 */

interface ArrayView {
    readonly kind: "array";
    readonly sourceText: string;
    readonly astKind: string;
    readonly itemCount: number;
    readonly items: readonly ExpressionView[];
}

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
    readonly objectText: string;
    readonly argumentText: string;
}

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly calleeText: string;
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

interface PrefixUnaryView {
    readonly kind: "prefix-unary";
    readonly sourceText: string;
    readonly operandText: string;
}

interface BooleanLiteralView {
    readonly kind: "boolean-literal";
    readonly sourceText: string;
    readonly value: boolean;
}

interface NullLiteralView {
    readonly kind: "null-literal";
    readonly sourceText: string;
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

interface BinaryView {
    readonly kind: "binary";
    readonly sourceText: string;
    readonly operator: string;
}

interface ConditionalView {
    readonly kind: "conditional";
    readonly sourceText: string;
}

interface FallbackView {
    readonly kind: "unknown";
    readonly sourceText: string;
    readonly astKind: string;
}

type ExpressionView =
    | ArrayView
    | IdentifierView
    | PropertyAccessView
    | ElementAccessView
    | CallView
    | StringLiteralView
    | NumberLiteralView
    | PrefixUnaryView
    | BooleanLiteralView
    | NullLiteralView
    | ObjectView
    | BinaryView
    | ConditionalView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (ts.isArrayLiteralExpression(arg)) {
        return {
            kind: "array",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            itemCount: arg.elements.length,
            items: arg.elements.map(view),
        };
    }
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
            objectText: arg.expression.getText(),
            argumentText: arg.argumentExpression.getText(),
        };
    }
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            calleeText: arg.expression.getText(),
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
    if (
        ts.isPrefixUnaryExpression(arg) &&
        arg.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(arg.operand)
    ) {
        return {
            kind: "prefix-unary",
            sourceText: arg.getText(),
            operandText: arg.operand.getText(),
        };
    }
    if (
        arg.kind === ts.SyntaxKind.TrueKeyword ||
        arg.kind === ts.SyntaxKind.FalseKeyword
    ) {
        return {
            kind: "boolean-literal",
            sourceText: arg.getText(),
            value: arg.kind === ts.SyntaxKind.TrueKeyword,
        };
    }
    if (arg.kind === ts.SyntaxKind.NullKeyword) {
        return {
            kind: "null-literal",
            sourceText: arg.getText(),
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
                        valueKind: ts.SyntaxKind[
                            p.initializer.kind
                        ],
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
    return {
        kind: "unknown",
        sourceText: arg.getText(),
        astKind: ts.SyntaxKind[arg.kind],
    };
}

function printView(v: ExpressionView, indent: string = "  "): string {
    switch (v.kind) {
        case "array":
            return (
                `kind: array | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | itemCount: ${v.itemCount}\n` +
                (v.items.length === 0
                    ? `${indent}items: []`
                    : v.items
                          .map((item, i) =>
                              `${indent}items[${i}]: ${printView(item, indent + "  ")}`,
                          )
                          .join("\n"))
            );
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
                `object: ${v.objectText} | argument: ${v.argumentText}`
            );
        case "call":
            return (
                `kind: call | sourceText: ${v.sourceText} | ` +
                `callee: ${v.calleeText} | argumentCount: ${v.argumentCount}`
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
        case "prefix-unary":
            return (
                `kind: prefix-unary | sourceText: ${v.sourceText} | ` +
                `operandText: ${v.operandText}`
            );
        case "boolean-literal":
            return (
                `kind: boolean-literal | sourceText: ${v.sourceText} | ` +
                `value: ${v.value}`
            );
        case "null-literal":
            return `kind: null-literal | sourceText: ${v.sourceText}`;
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
        case "binary":
            return (
                `kind: binary | sourceText: ${v.sourceText} | ` +
                `operator: ${v.operator}`
            );
        case "conditional":
            return `kind: conditional | sourceText: ${v.sourceText}`;
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
// Part A — synthetic array forms
// ============================================================
console.log(
    "\n===== D14 PART A — SYNTHETIC ARRAY FORMS =====\n",
);

const syntheticSource = `
class ArrayForms {
    @Decorator([])                                    m1Empty() {}
    @Decorator([A])                                   m2Single() {}
    @Decorator([A, B, C])                             m3Multi() {}
    @Decorator([AuthGuard, AdminGuard])               m4Identifiers() {}
    @Decorator(["a", 1, true, null])                  m5MixedPrimitives() {}
    @Decorator([HttpStatus.CREATED, HttpStatus.OK])   m6PropertyAccess() {}
    @Decorator([factory(), otherFactory("x")])        m7Calls() {}
    @Decorator([[A], [[B]]])                          m8Nested() {}
    @Decorator([
        AuthGuard,
        { guard: AdminGuard, options: [true, false] },
        factory("x")
    ])                                                m9MixedStructures() {}
    @Decorator([HttpStatus.CREATED, values["key"]])   m10PropertyAndElement() {}
    @Decorator([1 + 2, cond ? "a" : "b", -5])         m11BinaryConditionalPrefixUnary() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-array.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const arrayClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!arrayClass) {
    throw new Error("synthetic source had no class");
}

for (const member of arrayClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `ArrayForms.${methodName}`);
    }
}

// ============================================================
// Part B — critical invariant:
//          @Decorator([A, B])  → 1 top-level arg, itemCount 2
//          @Decorator(A, B)    → 2 top-level args
// ============================================================
console.log(
    "\n===== D14 PART B — ARRAY-AS-1-ARG vs 2 IDENTIFIERS =====\n",
);

const boundarySource = `
class ArrayBoundary {
    @Decorator([A, B])     arrayForm() {}
    @Decorator(A, B)       twoIdentifiers() {}
    @Decorator([A])        oneArgArray() {}
    @Decorator(A)           oneArgIdentifier() {}
}
`;

const boundaryFile = ts.createSourceFile(
    "array-boundary.ts",
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
        printDecorator(d, `ArrayBoundary.${methodName}`);
    }
}

// ============================================================
// Part C — real-looking NestJS array decorators
// ============================================================
console.log(
    "\n===== D14 PART C — REAL-LOOKING NESTJS ARRAY DECORATORS =====\n",
);

const nestSource = `
class NestArray {
    @UseGuards([JwtAuthGuard, AdminGuard])              guardsArray() {}
    @UseInterceptors([LoggingInterceptor, MetricsInterceptor]) interceptorsArray() {}
    @UsePipes([ValidationPipe({ whitelist: true }), ParseIntPipe]) pipesArray() {}
    @Roles(["admin", "user"])                           rolesStringArray() {}
    @SetMetadata("guards", [AuthGuard, RolesGuard])     metadataGuardsArray() {}
}
`;

const nestFile = ts.createSourceFile(
    "nest-array.ts",
    nestSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nestClass =
    nestFile.statements.find(ts.isClassDeclaration);

if (!nestClass) {
    throw new Error("nest-array source had no class");
}

for (const member of nestClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `NestArray.${methodName}`);
    }
}

// ============================================================
// Part D — deeply nested array integrity
// ============================================================
console.log(
    "\n===== D14 PART D — DEEPLY NESTED ARRAY INTEGRITY =====\n",
);

const deepSource = `
class DeepArray {
    @Decorator([[[A]]])     threeDeep() {}
    @Decorator([A, [B, [C, [D]]]])   irregularNested() {}
}
`;

const deepFile = ts.createSourceFile(
    "deep-array.ts",
    deepSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const deepClass =
    deepFile.statements.find(ts.isClassDeclaration);

if (!deepClass) {
    throw new Error("deep source had no class");
}

for (const member of deepClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `DeepArray.${methodName}`);
    }
}