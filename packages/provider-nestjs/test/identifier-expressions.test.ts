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
 * D10 audit test — identifier expressions.
 *
 * Verifies that:
 *   - Identifier expressions are correctly classified as `kind: "identifier"`
 *     and stay classified that way regardless of what they reference.
 *   - Identifiers are NOT conflated with strings, property-accesses,
 *     calls, prefixes, binaries, or conditionals.
 *   - Identifiers keep their AST identity independently of Symbol /
 *     Declaration resolution.
 *   - SymbolResolver and DeclarationResolver compose the three-layer
 *     architecture (Expression → Symbol → Declaration) for real
 *     identifiers (`@UseGuards(JwtAuthGuard)` and friends in
 *     apps/example-api).
 *   - Unresolved identifiers still report `kind: "identifier"` —
 *     expression classification and semantic resolution are separate.
 *
 * No production-code changes.
 */

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

interface CallView {
    readonly kind: "call";
    readonly sourceText: string;
    readonly astKind: string;
    readonly callee: string;
    readonly argumentCount: number;
}

interface StringLiteralView {
    readonly kind: "string-literal";
    readonly sourceText: string;
    readonly astKind: string;
    readonly value: string;
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

interface ElementAccessView {
    readonly kind: "element-access";
    readonly sourceText: string;
    readonly astKind: string;
    readonly object: string;
    readonly argumentText: string;
}

interface PrefixUnaryView {
    readonly kind: "prefix-unary";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
    readonly operandKind: string;
    readonly operandText: string;
}

interface BinaryView {
    readonly kind: "binary";
    readonly sourceText: string;
    readonly astKind: string;
    readonly operator: string;
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
    | IdentifierView
    | PropertyAccessView
    | CallView
    | StringLiteralView
    | ArrayView
    | ObjectView
    | ElementAccessView
    | PrefixUnaryView
    | BinaryView
    | ConditionalView
    | FallbackView;

function view(arg: ts.Expression): ExpressionView {
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
    if (ts.isCallExpression(arg)) {
        return {
            kind: "call",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            callee: arg.expression.getText(),
            argumentCount: arg.arguments.length,
        };
    }
    if (ts.isStringLiteral(arg)) {
        return {
            kind: "string-literal",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            value: arg.text,
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
    if (ts.isElementAccessExpression(arg)) {
        return {
            kind: "element-access",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            object: arg.expression.getText(),
            argumentText: arg.argumentExpression.getText(),
        };
    }
    if (ts.isPrefixUnaryExpression(arg)) {
        return {
            kind: "prefix-unary",
            sourceText: arg.getText(),
            astKind: ts.SyntaxKind[arg.kind],
            operator: ts.SyntaxKind[arg.operator],
            operandKind: ts.SyntaxKind[arg.operand.kind],
            operandText: arg.operand.getText(),
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
        case "identifier":
            return (
                `kind: identifier | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | name: ${v.name}`
            );
        case "property-access":
            return (
                `kind: property-access | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | object: ${v.object} | ` +
                `property: ${v.property}`
            );
        case "call":
            return (
                `kind: call | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind} | callee: ${v.callee} | ` +
                `argumentCount: ${v.argumentCount}`
            );
        case "string-literal":
            return (
                `kind: string-literal | sourceText: ${v.sourceText} | ` +
                `value: ${JSON.stringify(v.value)}`
            );
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
        case "element-access":
            return (
                `kind: element-access | sourceText: ${v.sourceText} | ` +
                `object: ${v.object} | argumentText: ${v.argumentText}`
            );
        case "prefix-unary":
            return (
                `kind: prefix-unary | sourceText: ${v.sourceText} | ` +
                `operator: ${v.operator} | operandKind: ${v.operandKind} | ` +
                `operandText: ${v.operandText}`
            );
        case "binary":
            return (
                `kind: binary | sourceText: ${v.sourceText} | ` +
                `operator: ${v.operator}`
            );
        case "conditional":
            return (
                `kind: conditional | sourceText: ${v.sourceText} | ` +
                `condition: ${v.conditionKind} | ` +
                `whenTrue: ${v.whenTrueKind} | ` +
                `whenFalse: ${v.whenFalseKind}`
            );
        case "unknown":
            return (
                `kind: unknown | sourceText: ${v.sourceText} | ` +
                `astKind: ${v.astKind}`
            );
    }
}

interface SymbolResolution {
    readonly expression: string;
    readonly inspectedKind: string;
    readonly symbolName: string | undefined;
    readonly symbolFlags: string | undefined;
    readonly declarationKinds: readonly string[];
    readonly firstDeclarationKind: string | undefined;
}

function resolveLayers(
    node: ts.Identifier,
    symbolResolver: SymbolResolver,
    declarationResolver: DeclarationResolver,
): SymbolResolution {
    const inspectedKind =
        new ExpressionInspector().inspect(node).kind;
    const symbol = symbolResolver.resolve(node);
    const declarations = declarationResolver.resolve(node);
    return {
        expression: node.getText(),
        inspectedKind,
        symbolName: symbol?.getName(),
        symbolFlags: symbol
            ? `flags=${symbol.flags}`
            : undefined,
        declarationKinds: declarations.map(d =>
            ts.SyntaxKind[d.kind],
        ),
        firstDeclarationKind:
            declarations.length > 0
                ? ts.SyntaxKind[declarations[0].kind]
                : undefined,
    };
}

function printResolution(r: SymbolResolution) {
    console.log(`--- Expression: ${r.expression} ---`);
    console.log(
        `  ExpressionInspector.kind: ${r.inspectedKind}`,
    );
    console.log(
        `  SymbolResolver  : name=${r.symbolName ?? "<undefined>"} | ` +
            `${r.symbolFlags ?? ""}`,
    );
    console.log(
        `  DeclarationResolver: ${r.declarationKinds.length} ` +
            `declaration(s): [${r.declarationKinds.join(", ")}]`,
    );
    console.log(
        `  First declaration kind: ${r.firstDeclarationKind ?? "<none>"}`,
    );
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();

// ============================================================
// Part A — synthetic identifier forms and confusions
// ============================================================
console.log(
    "\n===== D10 PART A — SYNTHETIC IDENTIFIER FORMS =====\n",
);

const syntheticSource = `
class Guards {
    @Decorator(AuthGuard)                                       m1() {}
    @Decorator(AuthGuard, AdminGuard, SomeGuard)               m2() {}
    @Decorator("AuthGuard")                                     m3() {}
    @Decorator(Auth.AuthGuard)                                  m4() {}
    @Decorator(AuthGuard())                                     m5() {}
    @Decorator([AuthGuard, AdminGuard])                         m6() {}
    @Decorator({ guard: AuthGuard })                            m7() {}
    @Decorator(UnknownGuard)                                    m8() {}
    @Decorator(-value)                                          m9() {}
    @Decorator(value + other)                                   m10() {}
    @Decorator(value ? A : B)                                   m11() {}
    @Decorator(HttpStatus.CREATED)                              m12() {}
    @Decorator(namespace["AuthGuard"])                          m13() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-identifier.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const identifierClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!identifierClass) {
    throw new Error("synthetic source had no class");
}

for (const member of identifierClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        const args = decoratorArguments.get(d);
        const name = decoratorReader.getName(d) ?? "<unnamed>";
        console.log(`--- Guards.${methodName} (${name}) ---`);
        console.log(`  argumentCount: ${args.length}`);
        args.forEach((arg, i) => {
            console.log(`  argument[${i}]: ${printView(view(arg))}`);
            const inspected = new ExpressionInspector().inspect(arg);
            console.log(
                `    ExpressionInspector.kind: ${inspected.kind}`,
            );
        });
    }
}

// Local function and constant — separate top-level fragment
const localSource = `
function factory() {}
const ROLE = "admin";
class Locals {
    @Decorator(MyGuard)        m1() {}
    @Decorator(factory)         m2() {}
    @Decorator(factory())       m3() {}
    @Decorator(ROLE)            m4() {}
}
class MyGuard {}
`;

const localFile = ts.createSourceFile(
    "local-identifiers.ts",
    localSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

console.log(
    "\n--- Local class / function / constant ---\n",
);
for (const stmt of localFile.statements) {
    if (!ts.isClassDeclaration(stmt)) continue;
    if (stmt.name?.text !== "Locals") continue;
    for (const member of stmt.members) {
        if (!ts.isMethodDeclaration(member)) continue;
        const methodName = member.name.getText();
        for (const d of decoratorReader.getDecorators(member)) {
            const args = decoratorArguments.get(d);
            const name = decoratorReader.getName(d) ?? "<unnamed>";
            console.log(`--- Locals.${methodName} (${name}) ---`);
            console.log(`  argumentCount: ${args.length}`);
            args.forEach((arg, i) => {
                const v = view(arg);
                console.log(`  argument[${i}]: ${printView(v)}`);
                console.log(
                    `    ExpressionInspector.kind: ${new ExpressionInspector().inspect(arg).kind}`,
                );
            });
        }
    }
}

// ============================================================
// Part B — real NestJS identifiers with three-layer
//          (Expression → Symbol → Declaration) resolution
// ============================================================
console.log(
    "\n===== D10 PART B — REAL NESTJS IDENTIFIERS =====\n",
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
    methodName?: string;
    decoratorName: string;
    scope: "class" | "method";
}> = [
    {
        className: "OrdersController",
        scope: "class",
        decoratorName: "UseGuards",
    },
    {
        className: "CartController",
        scope: "class",
        decoratorName: "UseGuards",
    },
    {
        className: "UsersController",
        methodName: "getProfile",
        scope: "method",
        decoratorName: "UseGuards",
    },
];

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        for (const target of realTargets.filter(
            t => t.className === className,
        )) {
            if (target.scope === "class") {
                for (const d of decoratorReader.getDecorators(
                    classNode,
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
                            ts.isIdentifier(arg)
                        ) {
                            printResolution(
                                resolveLayers(
                                    arg,
                                    symbolResolver,
                                    declarationResolver,
                                ),
                            );
                        } else {
                            console.log(
                                `--- ${target.decoratorName} arg[${i}] ---`,
                            );
                            console.log(
                                `  ExpressionInspector.kind: ${new ExpressionInspector().inspect(arg).kind}`,
                            );
                            console.log(
                                `  ${printView(view(arg))}`,
                            );
                        }
                    });
                }
                continue;
            }
            const methods = methodQuery.execute(classNode);
            for (const methodNode of methods) {
                if (
                    methodNode.name.getText() !==
                    (target.methodName ?? "")
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
                            ts.isIdentifier(arg)
                        ) {
                            printResolution(
                                resolveLayers(
                                    arg,
                                    symbolResolver,
                                    declarationResolver,
                                ),
                            );
                        }
                    });
                }
            }
        }
    }
}