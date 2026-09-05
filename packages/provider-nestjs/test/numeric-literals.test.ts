import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D7 audit test — numeric literals.
 *
 * Verifies that numeric decorator arguments:
 *   - correctly preserve numeric literal AST structure (positive int, zero,
 *     positive decimal, exponent, large number — all `ts.NumericLiteral`).
 *   - correctly preserve prefix-unary AST structure for negative numbers
 *     (`-10`, `-3.14`, `-1e3` are `ts.PrefixUnaryExpression` with
 *     `ts.SyntaxKind.MinusToken` operator wrapping a `ts.NumericLiteral`,
 *     NOT a single `NumericLiteral`).
 *   - expose BOTH the AST kind AND the semantic numeric value, distinctly.
 *   - do NOT evaluate unsafe expressions: `1 + 2` stays binary, `-value`
 *     stays prefix-unary-identifier.
 *   - do NOT classify `HttpStatus.CREATED` as a number — it remains a
 *     property-access.
 *
 * Four fixtures:
 *   A. Synthetic D7 spec cases (positive ints, zero, decimal, negative,
 *     exponent, large, multiple, mixed).
 *   B. Real NestJS coverage — verifies that `HttpStatus.CREATED` is a
 *     property-access (NOT a number) — explicitly preserved.
 *   C. NOT-a-number cases (`1 + 2`, `-value`) — must NOT be evaluated.
 *   D. Boundary check that `201` (positive number) and `-10` (prefix-unary
 *     wrapping a numeric literal) are classified as different kinds.
 */

interface NumericLiteralView {
    readonly kind: "numeric-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "number";
    readonly value: number;
}

interface PrefixUnaryNumericView {
    readonly kind: "prefix-unary-numeric";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
    readonly operandSourceText: string;
    readonly operandAstKind: string;
    readonly semanticKind: "number";
    readonly value: number;
}

interface BinaryExpressionView {
    readonly kind: "binary";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
}

interface PrefixUnaryIdentifierView {
    readonly kind: "prefix-unary-identifier";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
    readonly operandKind: string;
    readonly operandText: string;
}

interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly astKind: string;
    readonly name: string;
}

interface PropertyAccessView {
    readonly kind: "property-access";
    readonly sourceText: string;
    readonly astKind: string;
    readonly object: string;
    readonly property: string;
}

interface StringLiteralView {
    readonly kind: "string-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "string";
    readonly value: string;
}

interface BooleanLiteralView {
    readonly kind: "boolean-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "boolean";
    readonly value: boolean;
}

interface NullLiteralView {
    readonly kind: "null-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly semanticKind: "null";
}

type ArgView =
    | NumericLiteralView
    | PrefixUnaryNumericView
    | BinaryExpressionView
    | PrefixUnaryIdentifierView
    | IdentifierView
    | PropertyAccessView
    | StringLiteralView
    | BooleanLiteralView
    | NullLiteralView;

function view(arg: ts.Expression): ArgView {
    if (ts.isNumericLiteral(arg)) {
        const v = Number(arg.text);
        return {
            kind: "numeric-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            semanticKind: "number",
            value: v,
        };
    }
    if (
        ts.isPrefixUnaryExpression(arg) &&
        arg.operator === ts.SyntaxKind.MinusToken &&
        ts.isNumericLiteral(arg.operand)
    ) {
        return {
            kind: "prefix-unary-numeric",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            operator: ts.SyntaxKind[arg.operator],
            operandSourceText: arg.operand.getText(),
            operandAstKind: ts.SyntaxKind[arg.operand.kind],
            semanticKind: "number",
            value: -Number(arg.operand.text),
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
    if (ts.isPrefixUnaryExpression(arg)) {
        return {
            kind: "prefix-unary-identifier",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            operator: ts.SyntaxKind[arg.operator],
            operandKind: ts.SyntaxKind[arg.operand.kind],
            operandText: arg.operand.getText(),
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
    if (ts.isPropertyAccessExpression(arg)) {
        return {
            kind: "property-access",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            object: arg.expression.getText(),
            property: arg.name.getText(),
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
    if (arg.kind === ts.SyntaxKind.NullKeyword) {
        return {
            kind: "null-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            semanticKind: "null",
        };
    }
    throw new Error(
        `unsupported arg kind: ${ts.SyntaxKind[arg.kind]}`,
    );
}

function printView(v: ArgView): string {
    switch (v.kind) {
        case "numeric-literal":
            return (
                `kind: numeric-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: ${v.value}`
            );
        case "prefix-unary-numeric":
            return (
                `kind: prefix-unary-numeric | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | operator: ${v.operator} | ` +
                `operandSourceText: ${v.operandSourceText} | ` +
                `operandAstKind: ${v.operandAstKind} | ` +
                `semanticKind: ${v.semanticKind} | value: ${v.value}`
            );
        case "binary":
            return (
                `kind: binary | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | operator: ${v.operator}`
            );
        case "prefix-unary-identifier":
            return (
                `kind: prefix-unary-identifier | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | operator: ${v.operator} | ` +
                `operandKind: ${v.operandKind} | operandText: ${v.operandText}`
            );
        case "identifier":
            return (
                `kind: identifier | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | name: ${v.name}`
            );
        case "property-access":
            return (
                `kind: property-access | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | object: ${v.object} | property: ${v.property}`
            );
        case "string-literal":
            return (
                `kind: string-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: ${JSON.stringify(v.value)}`
            );
        case "boolean-literal":
            return (
                `kind: boolean-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind} | ` +
                `value: ${v.value}`
            );
        case "null-literal":
            return (
                `kind: null-literal | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | semanticKind: ${v.semanticKind}`
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
        console.log(`  argument[${i}]:`);
        console.log(`    ${printView(view(arg))}`);
        // Also surface the ExpressionInspector classification so D7 ties
        // back to the production inspector.
        const inspected = expressionInspector.inspect(arg);
        console.log(
            `    ExpressionInspector.kind: ${inspected.kind}`,
        );
    });
}

// ============================================================
// Part A — synthetic D7 spec cases
// ============================================================
console.log(
    "\n===== D7 PART A — SYNTHETIC NUMERIC FORMS =====\n",
);

const syntheticSource = `
class Numerics {
    @Decorator(201)                 m1() {}
    @Decorator(0)                   m2() {}
    @Decorator(3.14)                m3() {}
    @Decorator(-10)                 m4() {}
    @Decorator(-3.14)               m5() {}
    @Decorator(1e3)                 m6() {}
    @Decorator(-1e3)                m7() {}
    @Decorator(9007199254740991)    m8() {}
    @Decorator(1, 2, 3)             m9() {}
    @Decorator("users", 201, -10, true) m10() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-numeric.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const numericClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!numericClass) {
    throw new Error("synthetic source had no class");
}

for (const member of numericClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Numerics.${methodName}`);
    }
}

// ============================================================
// Part B — real NestJS: HttpStatus.CREATED must STAY
//          property-access (it is NOT a number)
// ============================================================
console.log(
    "\n===== D7 PART B — REAL NESTJS PROPERTY-ACCESS (NOT NUMBER) =====\n",
);

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const scanner = new SourceScanner(project);
const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);
const methodQuery = new MethodQuery(walker);

const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

const httpCodeTargets: ReadonlyArray<{
    className: string;
    methodName: string;
}> = [
    { className: "ProductsController", methodName: "create" },
    { className: "OrdersController", methodName: "create" },
    { className: "CartController", methodName: "addItem" },
    { className: "ProductsController", methodName: "remove" },
];

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        for (const target of httpCodeTargets.filter(
            t => t.className === className,
        )) {
            const methods = methodQuery.execute(classNode);
            for (const methodNode of methods) {
                if (
                    methodNode.name.getText() !== target.methodName
                ) {
                    continue;
                }
                for (const d of decoratorReader.getDecorators(
                    methodNode,
                )) {
                    if (
                        decoratorReader.getName(d) !== "HttpCode"
                    ) {
                        continue;
                    }
                    printDecorator(
                        d,
                        `${className}.${target.methodName} (@HttpCode)`,
                    );
                }
            }
        }
    }
}

// ============================================================
// Part C — NOT-a-number cases: 1 + 2 must stay binary,
//          -value must stay prefix-unary-identifier
// ============================================================
console.log(
    "\n===== D7 PART C — NOT-A-NUMBER (no unsafe evaluation) =====\n",
);

const notNumberSource = `
class NotNumbers {
    @Decorator(1 + 2)      m1() {}
    @Decorator(-value)     m2() {}
    @Decorator(-x.y)       m3() {}
}
`;

const notNumberFile = ts.createSourceFile(
    "not-numbers.ts",
    notNumberSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const notNumberClass =
    notNumberFile.statements.find(ts.isClassDeclaration);

if (!notNumberClass) {
    throw new Error("not-number source had no class");
}

for (const member of notNumberClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `NotNumbers.${methodName}`);
    }
}

// ============================================================
// Part D — classification boundary:
//          201 (positive) vs -10 (prefix-unary wrapping numeric)
// ============================================================
console.log(
    "\n===== D7 PART D — POSITIVE vs NEGATIVE CLASSIFICATION =====\n",
);

const boundarySource = `
class Boundary {
    @Decorator(201)  positive() {}
    @Decorator(-10)  negative() {}
}
`;

const boundaryFile = ts.createSourceFile(
    "boundary.ts",
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
        printDecorator(d, `Boundary.${methodName}`);
    }
}