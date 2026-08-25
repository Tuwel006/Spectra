import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";
import { ExpressionInspector } from "@spectra/provider-ast";

/**
 * D15 audit test — object literal expressions.
 *
 * Verifies that ts.ObjectLiteralExpression used as a top-level decorator
 * argument is correctly classified as kind: "object" with property
 * keys (and computed keys, shorthand, spread) surfaced structurally.
 *
 * No production-code changes — ExpressionInspector already returns
 * kind: "object" for ts.isObjectLiteralExpression.
 */

interface ObjectView {
    readonly kind: "object";
    readonly sourceText: string;
    readonly properties: ReadonlyArray<{
        readonly key: string;
        readonly keyKind: string;
        readonly keyText: string;
        readonly value: ExpressionView;
    }>;
}

interface ArrayView {
    readonly kind: "array";
    readonly sourceText: string;
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

interface BooleanLiteralView {
    readonly kind: "boolean-literal";
    readonly sourceText: string;
    readonly value: boolean;
}

interface NullLiteralView {
    readonly kind: "null-literal";
    readonly sourceText: string;
}

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly calleeText: string;
    readonly argumentCount: number;
}

interface ArrowView {
    readonly kind: "arrow-function";
    readonly sourceText: string;
    readonly parameterCount: number;
}

interface FunctionView {
    readonly kind: "function";
    readonly sourceText: string;
    readonly parameterCount: number;
}

interface ElementAccessView {
    readonly kind: "element-access";
    readonly sourceText: string;
    readonly objectText: string;
    readonly argumentText: string;
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
    | ObjectView
    | ArrayView
    | IdentifierView
    | PropertyAccessView
    | StringLiteralView
    | NumberLiteralView
    | BooleanLiteralView
    | NullLiteralView
    | CallView
    | ArrowView
    | FunctionView
    | ElementAccessView
    | BinaryView
    | ConditionalView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
    if (ts.isObjectLiteralExpression(arg)) {
        return {
            kind: "object",
            sourceText: arg.getText(),
            properties: arg.properties.map(p => {
                if (ts.isPropertyAssignment(p)) {
                    return {
                        key: p.name?.getText() ?? "",
                        keyKind: ts.SyntaxKind[p.name?.kind ?? -1],
                        keyText: p.name?.getText() ?? "",
                        value: view(p.initializer),
                    };
                }
                if (ts.isShorthandPropertyAssignment(p)) {
                    return {
                        key: p.name.getText(),
                        keyKind: "ShorthandPropertyAssignment",
                        keyText: p.name.getText(),
                        value: {
                            kind: "identifier",
                            sourceText: p.name.getText(),
                            name: p.name.text,
                        },
                    };
                }
                if (ts.isSpreadAssignment(p)) {
                    return {
                        key: "<spread>",
                        keyKind: "SpreadElement",
                        keyText: p.getText(),
                        value: {
                            kind: "unknown",
                            sourceText: p.getText(),
                            astKind: ts.SyntaxKind[p.kind],
                        },
                    };
                }
                return {
                    key: "<unsupported>",
                    keyKind: ts.SyntaxKind[p.kind],
                    keyText: p.getText(),
                    value: {
                        kind: "unknown",
                        sourceText: p.getText(),
                        astKind: ts.SyntaxKind[p.kind],
                    },
                };
            }),
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
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            calleeText: arg.expression.getText(),
            argumentCount: arg.arguments.length,
        };
    }
    if (ts.isArrowFunction(arg)) {
        return {
            kind: "arrow-function",
            sourceText: arg.getText(),
            parameterCount: arg.parameters.length,
        };
    }
    if (ts.isFunctionExpression(arg)) {
        return {
            kind: "function",
            sourceText: arg.getText(),
            parameterCount: arg.parameters.length,
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
        case "object":
            return (
                `kind: object | sourceText: ${v.sourceText}\n` +
                v.properties
                    .map(p =>
                        `${indent}${p.key} (${p.keyKind})\n` +
                        `${indent}  ${printView(p.value, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "array":
            return (
                `kind: array | sourceText: ${v.sourceText} | ` +
                `itemCount: ${v.itemCount}\n` +
                v.items
                    .map((it, i) =>
                        `${indent}items[${i}]: ${printView(it, indent + "  ")}`,
                    )
                    .join("\n")
            );
        case "identifier":
            return `kind: identifier | sourceText: ${v.sourceText} | name: ${v.name}`;
        case "property-access":
            return `kind: property-access | sourceText: ${v.sourceText} | object: ${v.objectText} | property: ${v.property}`;
        case "element-access":
            return `kind: element-access | sourceText: ${v.sourceText} | object: ${v.objectText} | argument: ${v.argumentText}`;
        case "string-literal":
            return `kind: string-literal | sourceText: ${v.sourceText} | value: ${JSON.stringify(v.value)}`;
        case "number-literal":
            return `kind: number-literal | sourceText: ${v.sourceText} | value: ${v.value}`;
        case "boolean-literal":
            return `kind: boolean-literal | sourceText: ${v.sourceText} | value: ${v.value}`;
        case "null-literal":
            return `kind: null-literal | sourceText: ${v.sourceText}`;
        case "call":
            return `kind: call | sourceText: ${v.sourceText} | callee: ${v.calleeText} | argumentCount: ${v.argumentCount}`;
        case "arrow-function":
            return `kind: arrow-function | sourceText: ${v.sourceText} | parameterCount: ${v.parameterCount}`;
        case "function":
            return `kind: function | sourceText: ${v.sourceText} | parameterCount: ${v.parameterCount}`;
        case "binary":
            return `kind: binary | sourceText: ${v.sourceText} | operator: ${v.operator}`;
        case "conditional":
            return `kind: conditional | sourceText: ${v.sourceText}`;
        case "unknown":
            return `kind: unknown | sourceText: ${v.sourceText} | astKind: ${v.astKind}`;
    }
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const expressionInspector = new ExpressionInspector();

function printDecorator(d: ts.Decorator, context: string) {
    const args = decoratorArguments.get(d);
    const name = decoratorReader.getName(d) ?? "<unnamed>";
    console.log(`--- ${context} ---`);
    console.log(`Decorator: @${name}(...)`);
    console.log(`  argumentCount: ${args.length}`);
    args.forEach((arg, i) => {
        console.log(`  argument[${i}]: ${printView(view(arg))}`);
        console.log(
            `    ExpressionInspector.kind: ${expressionInspector.inspect(arg).kind}`,
        );
    });
}

const source = `
class ObjForms {
    @Decorator({})                                  m1Empty() {}
    @Decorator({ enabled: true })                   m2SingleBool() {}
    @Decorator({ guard: AuthGuard })                m3SingleId() {}
    @Decorator({ status: HttpStatus.CREATED })      m4SingleProp() {}
    @Decorator({ guards: [AuthGuard, AdminGuard] }) m5ArrayInside() {}
    @Decorator({ outer: { inner: { guard: JwtAuthGuard } } }) m6DeeplyNested() {}
    @Decorator({ a: 1, b: "x", c: true, d: null })  m7MixedPrimitives() {}
    @Decorator({ name })                            m8Shorthand() {}
    @Decorator({ ...options })                      m9Spread() {}
    @Decorator({ guard: factory() })                m10CallValue() {}
    @Decorator({ handle: () => true })              m11ArrowFn() {}
    @Decorator({ handle: function () { return true; } }) m12FunctionExpr() {}
    @Decorator({ [key]: value })                    m13ComputedKey() {}
    @Decorator({ "quoted-key": 1 })                 m14QuotedKey() {}
    @Decorator({ method(arg) { return arg; } })     m15MethodProperty() {}
}
`;

const file = ts.createSourceFile(
    "synthetic-object.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const cls = file.statements.find(ts.isClassDeclaration);
if (!cls) throw new Error("no class");

console.log("\n===== D15 PART A — SYNTHETIC OBJECT FORMS =====\n");
for (const member of cls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `ObjForms.${member.name.getText()}`);
    }
}

// Boundary: @Decorator({a, b}) vs @Decorator({a: 1, b: 2}) vs @Decorator(a, b)
console.log("\n===== D15 PART B — OBJECT-1-ARG vs 2-ID BOUNDARY =====\n");
const b = ts.createSourceFile(
    "boundary.ts",
    `
class B {
    @Decorator({ a: 1, b: 2 })  objectForm() {}
    @Decorator(a, b)            twoArgs() {}
    @Decorator({ a })           shorthandForm() {}
    @Decorator({ key: factory() }) computedCall() {}
}
`,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);
const bc = b.statements.find(ts.isClassDeclaration);
if (!bc) throw new Error("no class");
for (const m of bc.members) {
    if (!ts.isMethodDeclaration(m)) continue;
    for (const d of decoratorReader.getDecorators(m)) {
        printDecorator(d, `B.${m.name.getText()}`);
    }
}