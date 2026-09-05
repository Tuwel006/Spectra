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
 * D13 audit test — call expressions.
 *
 * Verifies that ts.CallExpression used as a top-level decorator argument
 * is correctly classified as `kind: "call"` and never executed.
 * Every nested expression kind inside a call's argument list must also be
 * represented structurally — no coercion, no evaluation.
 *
 * No production-code changes — `ExpressionInspector` already returns
 * `kind: "call"` for `ts.isCallExpression`.
 */

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly astKind: string;
    readonly calleeKind: string;
    readonly calleeText: string;
    readonly argumentCount: number;
    readonly arguments: readonly ExpressionView[];
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
    | CallView
    | IdentifierView
    | PropertyAccessView
    | ElementAccessView
    | StringLiteralView
    | NumberLiteralView
    | PrefixUnaryView
    | BooleanLiteralView
    | NullLiteralView
    | ArrayView
    | ObjectView
    | BinaryView
    | ConditionalView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            calleeKind: ts.SyntaxKind[
                arg.expression.kind
            ],
            calleeText: arg.expression.getText(),
            argumentCount: arg.arguments.length,
            arguments: arg.arguments.map(view),
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
        case "call":
            return (
                `kind: call | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | calleeKind: ${v.calleeKind} | ` +
                `calleeText: ${v.calleeText} | argumentCount: ${v.argumentCount}\n` +
                (v.arguments.length === 0
                    ? `${indent}args: []`
                    : v.arguments
                          .map((a, i) =>
                              `${indent}args[${i}]: ${printView(a, indent + "  ")}`,
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
// Part A — synthetic call expression forms
// ============================================================
console.log(
    "\n===== D13 PART A — SYNTHETIC CALL FORMS =====\n",
);

const syntheticSource = `
class CallForms {
    @Decorator(factory())                                  m1() {}
    @Decorator(factory("x"))                               m2() {}
    @Decorator(factory("x", 123, true))                    m3() {}
    @Decorator(first(), second("x"))                      m4() {}
    @Decorator(factory("a"))                               m5String() {}
    @Decorator(factory(123))                               m5Number() {}
    @Decorator(factory(-123))                              m5Negative() {}
    @Decorator(factory(true))                              m5Boolean() {}
    @Decorator(factory(null))                              m5Null() {}
    @Decorator(factory(MyGuard))                           m5Identifier() {}
    @Decorator(factory(HttpStatus.CREATED))                m5Property() {}
    @Decorator(factory(values["key"]))                     m5Element() {}
    @Decorator(factory(inner()))                           m5Nested() {}
    @Decorator(factory([1, 2, 3]))                         m5Array() {}
    @Decorator(factory({ role: "admin" }))                 m5Object() {}
    @Decorator(factory(1 + 2))                             m5Binary() {}
    @Decorator(factory(cond ? "a" : "b"))                  m5Conditional() {}
    @Decorator(factory(inner(deep())))                     m6Nested2() {}
    @Decorator([factory()])                                m7ArrayCall() {}
    @Decorator({ guard: factory() })                      m8ObjectCall() {}
    @Decorator({ config: { factory: create() } })         m9NestedObject() {}
    @Decorator(factory().value)                            m10ReceiverProperty() {}
    @Decorator(factory()["value"])                         m11ReceiverElement() {}
    @Decorator(factory()())                                m12ReceiverCall() {}
    @Decorator(factory)                                    m13IdentifierOnly() {}
    @Decorator(factory())                                  m13bCallOnly() {}
    @Decorator(factory.value)                              m13cPropertyOnly() {}
    @Decorator(factory["value"])                           m13dElementOnly() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-call.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const callClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!callClass) {
    throw new Error("synthetic source had no class");
}

for (const member of callClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `CallForms.${methodName}`);
    }
}

// ============================================================
// Part B — real-looking NestJS factories (no real example-api
//          matches because all guards/interceptors there are
//          identifiers, not calls — per D13 protocol we use
//          synthetic NestJS-style fixtures rather than modifying
//          production controllers)
// ============================================================
console.log(
    "\n===== D13 PART B — REAL-LOOKING NESTJS FACTORY CALLS =====\n",
);

const nestSource = `
class NestCall {
    @UseGuards(AuthGuard())                                guardFactory() {}
    @UseInterceptors(LoggingInterceptor("verbose"))        interceptorFactory() {}
    @UsePipes(ValidationPipe({ whitelist: true }))         pipeFactory() {}
    @SetMetadata("role", computeRole("admin"))             metadataFactory() {}
    @Roles(defineRoles(["admin", "user"]))                 rolesFactory() {}
}
`;

const nestFile = ts.createSourceFile(
    "nest-call.ts",
    nestSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nestClass =
    nestFile.statements.find(ts.isClassDeclaration);

if (!nestClass) {
    throw new Error("nest-call source had no class");
}

for (const member of nestClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `NestCall.${methodName}`);
    }
}

// ============================================================
// Part C — count integrity: top-level decorator argumentCount
//          vs nested call argumentCount
// ============================================================
console.log(
    "\n===== D13 PART C — TOP-LEVEL vs NESTED ARG COUNT INTEGRITY =====\n",
);

const countSource = `
class CountIntegrity {
    @Decorator(factory("a", "b", "c"))   threeInOne() {}
    @Decorator([factory("a", "b")])      arrayOfFactory() {}
    @Decorator(first(), second("x"))     twoTopLevel() {}
}
`;

const countFile = ts.createSourceFile(
    "count-integrity.ts",
    countSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const countClass =
    countFile.statements.find(ts.isClassDeclaration);

if (!countClass) {
    throw new Error("count source had no class");
}

for (const member of countClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `CountIntegrity.${methodName}`);
    }
}

// ============================================================
// Part D — example-api integration: scan for any call-typed
//          decorator arguments that may already exist
// ============================================================
console.log(
    "\n===== D13 PART D — EXAMPLE-API CALL SCAN =====\n",
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

let totalCallsFound = 0;
for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        const methods = methodQuery.execute(classNode);
        for (const methodNode of methods) {
            for (const d of decoratorReader.getDecorators(
                methodNode,
            )) {
                for (const arg of decoratorArguments.get(d)) {
                    if (ts.isCallExpression(arg)) {
                        totalCallsFound++;
                        console.log(
                            `  ${className}.${methodNode.name.getText()} : ` +
                                `${arg.getText()}  (kind: call, NOT executed)`,
                        );
                    }
                }
            }
        }
    }
}
console.log(`  Total CallExpression decorator arguments in example-api: ${totalCallsFound}`);