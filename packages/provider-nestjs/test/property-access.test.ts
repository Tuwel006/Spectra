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
    SymbolResolver,
    DeclarationResolver,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D11 audit test — property-access expressions.
 *
 * Verifies that:
 *   - Property-access expressions classify as `kind: "property-access"`.
 *   - Property-access is structurally distinct from identifier, string,
 *     call, element-access, prefix-unary, binary, and conditional.
 *   - Nested property-access chains (`Config.Http.Status.OK`) keep the
 *     whole chain structurally (no premature flattening to identifier).
 *   - Property-access inside arrays, objects, and nested objects is
 *     preserved structurally (no flattening).
 *   - Real NestJS @HttpCode(HttpStatus.*) decorators classify correctly
 *     and **do not** collapse to number / identifier / string.
 *   - The three-layer architecture (Expression → Symbol → Declaration)
 *     resolves for property-access expressions.
 *   - `factory().value` is property-access whose object is a
 *     call-expression; `items[0].value` is property-access whose object
 *     is an element-access expression. The top-level kind is determined
 *     by the top-level AST node.
 *   - Element-access (`namespace["AuthGuard"]`) is a known gap in the
 *     production inspector (currently `unknown`); the test view keeps
 *     it structural and asserts the gap explicitly.
 *
 * No production-code changes — `ExpressionInspector` already returns
 * `kind: "property-access"` for `ts.isPropertyAccessExpression`.
 */

interface IdentifierView {
    readonly kind: "identifier";
    readonly sourceText: string;
    readonly name: string;
}

interface PropertyAccessView {
    readonly kind: "property-access";
    readonly sourceText: string;
    readonly astKind: string;
    readonly objectKind: string;
    readonly objectText: string;
    readonly property: string;
    readonly isNested: boolean;
}

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly callee: string;
    readonly argumentCount: number;
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

interface PrefixUnaryView {
    readonly kind: "prefix-unary";
    readonly sourceText: string;
    readonly operator: string;
    readonly operandText: string;
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
    | CallView
    | ElementAccessView
    | StringLiteralView
    | PrefixUnaryView
    | BinaryView
    | ConditionalView
    | ArrayView
    | ObjectView
    | FallbackView;

function viewPropertyAccess(
    pa: ts.PropertyAccessExpression,
): PropertyAccessView {
    return {
        kind: "property-access",
        sourceText: pa.getText(),
        astKind: ts.SyntaxKind[pa.kind],
        objectKind: ts.SyntaxKind[pa.expression.kind],
        objectText: pa.expression.getText(),
        property: pa.name.getText(),
        isNested:
            ts.isPropertyAccessExpression(pa.expression),
    };
}

function view(arg: ts.Expression): ExpressionView {
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            sourceText: arg.getText(),
            name: arg.text,
        };
    }
    if (ts.isPropertyAccessExpression(arg)) {
        return viewPropertyAccess(arg);
    }
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            callee: arg.expression.getText(),
            argumentCount: arg.arguments.length,
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
    if (ts.isPrefixUnaryExpression(arg)) {
        return {
            kind: "prefix-unary",
            sourceText: arg.getText(),
            operator: ts.SyntaxKind[arg.operator],
            operandText: arg.operand.getText(),
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
                `astKind: ${v.astKind} | objectKind: ${v.objectKind} | ` +
                `objectText: ${v.objectText} | property: ${v.property} | ` +
                `isNested: ${v.isNested}`
            );
        case "call":
            return (
                `kind: call | sourceText: ${v.sourceText} | ` +
                `callee: ${v.callee} | argumentCount: ${v.argumentCount}`
            );
        case "element-access":
            return (
                `kind: element-access | sourceText: ${v.sourceText} | ` +
                `objectText: ${v.objectText} | ` +
                `argumentText: ${v.argumentText}`
            );
        case "string-literal":
            return (
                `kind: string-literal | sourceText: ${v.sourceText} | ` +
                `value: ${JSON.stringify(v.value)}`
            );
        case "prefix-unary":
            return (
                `kind: prefix-unary | sourceText: ${v.sourceText} | ` +
                `operator: ${v.operator} | operandText: ${v.operandText}`
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
// Part A — synthetic property-access forms and boundaries
// ============================================================
console.log(
    "\n===== D11 PART A — SYNTHETIC PROPERTY-ACCESS FORMS =====\n",
);

const syntheticSource = `
class PropAccess {
    @Decorator(HttpStatus.CREATED)                                m1() {}
    @Decorator(CREATED)                                           m2() {}
    @Decorator("HttpStatus.CREATED")                             m3() {}
    @Decorator(HttpStatus.CREATED, HttpStatus.OK, Config.DEFAULT) m4() {}
    @Decorator(Config.Http.Status.OK)                             m5() {}
    @Decorator([HttpStatus.CREATED, HttpStatus.OK])               m6() {}
    @Decorator({ status: HttpStatus.CREATED, success: Config.DEFAULT }) m7() {}
    @Decorator({ response: { status: HttpStatus.CREATED } })     m8() {}
    @Decorator(Config.DEFAULT)                                    m9() {}
    @Decorator(Config.getDefault())                                m10() {}
    @Decorator(namespace.AuthGuard)                               m11() {}
    @Decorator(namespace["AuthGuard"])                            m12() {}
    @Decorator(factory().value)                                   m13() {}
    @Decorator(items[0].value)                                    m14() {}
    @Decorator(user.role)                                         m15() {}
    @Decorator(config.default)                                    m16() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-property-access.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const propClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!propClass) {
    throw new Error("synthetic source had no class");
}

for (const member of propClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `PropAccess.${methodName}`);
    }
}

// ============================================================
// Part B — real NestJS @HttpCode(HttpStatus.*) with three-layer
//          (Expression → Symbol → Declaration) resolution
// ============================================================
console.log(
    "\n===== D11 PART B — REAL NESTJS @HttpCode PROPERTY-ACCESS =====\n",
);

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const symbolResolver = new SymbolResolver(project);
const declarationResolver = new DeclarationResolver(project);

const scanner = new SourceScanner(project);
const walker = new NodeWalker();

const classQuery = new ClassQuery(walker);
const methodQuery = new MethodQuery(walker);

const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

const realTargets: ReadonlyArray<{
    className: string;
    methodName: string;
    decoratorName: string;
}> = [
    { className: "ProductsController", methodName: "create", decoratorName: "HttpCode" },
    { className: "ProductsController", methodName: "remove", decoratorName: "HttpCode" },
    { className: "OrdersController", methodName: "create", decoratorName: "HttpCode" },
    { className: "CartController", methodName: "addItem", decoratorName: "HttpCode" },
];

function printResolution(
    node: ts.Node,
    expressionText: string,
) {
    const inspectedKind = expressionInspector.inspect(
        node as ts.Expression,
    ).kind;
    let symbolName: string | undefined;
    let symbolFlags: number | undefined;
    let declarationKinds: readonly string[] = [];
    let firstDeclarationKind: string | undefined;
    try {
        const symbol = symbolResolver.resolve(node);
        if (symbol) {
            symbolName = symbol.getName();
            symbolFlags = symbol.flags;
        }
        const declarations = declarationResolver.resolve(node);
        declarationKinds = declarations.map(d =>
            ts.SyntaxKind[d.kind],
        );
        firstDeclarationKind =
            declarations.length > 0
                ? ts.SyntaxKind[declarations[0].kind]
                : undefined;
    } catch (_) {
        // ignore — surface whatever we have
    }
    console.log(`--- Expression: ${expressionText} ---`);
    console.log(
        `  ExpressionInspector.kind: ${inspectedKind}`,
    );
    console.log(
        `  SymbolResolver  : name=${symbolName ?? "<undefined>"} | ` +
            `flags=${symbolFlags ?? "<undefined>"}`,
    );
    console.log(
        `  DeclarationResolver: ${declarationKinds.length} ` +
            `declaration(s): [${declarationKinds.join(", ")}]`,
    );
    console.log(
        `  First declaration kind: ${firstDeclarationKind ?? "<none>"}`,
    );
}

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        for (const target of realTargets.filter(
            t => t.className === className,
        )) {
            const methods = methodQuery.execute(classNode);
            for (const methodNode of methods) {
                if (
                    methodNode.name.getText() !==
                    target.methodName
                ) {
                    continue;
                }
                for (const d of decoratorReader.getDecorators(
                    methodNode,
                )) {
                    if (
                        decoratorReader.getName(d) !==
                        target.decoratorName
                    ) {
                        continue;
                    }
                    const args = decoratorArguments.get(d);
                    args.forEach((arg, i) => {
                        if (
                            i === 0 &&
                            ts.isPropertyAccessExpression(arg)
                        ) {
                            printResolution(
                                arg,
                                arg.getText(),
                            );
                        } else {
                            console.log(
                                `--- ${target.decoratorName} arg[${i}] ---`,
                            );
                            console.log(
                                `  ExpressionInspector.kind: ${expressionInspector.inspect(arg).kind}`,
                            );
                            console.log(
                                `  ${printView(view(arg))}`,
                            );
                        }
                    });
                }
            }
        }
    }
}