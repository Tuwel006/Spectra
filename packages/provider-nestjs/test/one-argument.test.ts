import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D4 audit test — one argument.
 *
 * Verifies that decorators with exactly one argument preserve the AST
 * expression correctly. Each argument must be inspected by kind
 * (using TypeScript's narrowing predicates and the existing
 * ExpressionInspector namespace semantics) and rendered with the right
 * semantic value, identifier name, object/property pair, callee, array
 * items, object property list, etc.
 *
 * Three fixtures:
 *   A. Synthetic source with one decorator per method, one per D4 case
 *      (string, empty-string, number, boolean, null, identifier,
 *      property-access, call, array-as-one-arg, object-as-one-arg).
 *   B. Real NestJS fixtures from example-api covering @Controller("products"),
 *      @Get(":id"), @Param("id"), @Query("category"),
 *      @HttpCode(HttpStatus.CREATED), @UseGuards(JwtAuthGuard).
 *   C. The crucial @UseGuards(AuthGuard) vs @UseGuards([AuthGuard, AdminGuard])
 *      distinction — same decorator arg count (1), different expression kind
 *      (identifier vs array with 2 items).
 */

interface BaseDescription {
    readonly kind: string;
}

interface StringDescription extends BaseDescription {
    readonly kind: "string";
    readonly value: string;
}

interface NumberDescription extends BaseDescription {
    readonly kind: "number";
    readonly value: number;
}

interface BooleanDescription extends BaseDescription {
    readonly kind: "boolean";
    readonly value: boolean;
}

interface NullDescription extends BaseDescription {
    readonly kind: "null";
}

interface IdentifierDescription extends BaseDescription {
    readonly kind: "identifier";
    readonly name: string;
}

interface PropertyAccessDescription extends BaseDescription {
    readonly kind: "property-access";
    readonly object: string;
    readonly property: string;
}

interface CallDescription extends BaseDescription {
    readonly kind: "call";
    readonly callee: string;
    readonly argumentCount: number;
}

interface ArrayDescription extends BaseDescription {
    readonly kind: "array";
    readonly itemCount: number;
    readonly items: readonly ExpressionDescription[];
}

interface ObjectDescription extends BaseDescription {
    readonly kind: "object";
    readonly propertyKeys: readonly string[];
}

interface FallbackDescription extends BaseDescription {
    readonly kind: "unknown";
    readonly ast: string;
}

type ExpressionDescription =
    | StringDescription
    | NumberDescription
    | BooleanDescription
    | NullDescription
    | IdentifierDescription
    | PropertyAccessDescription
    | CallDescription
    | ArrayDescription
    | ObjectDescription
    | FallbackDescription;

function describe(
    expr: ts.Expression,
): ExpressionDescription {
    if (ts.isStringLiteral(expr)) {
        return { kind: "string", value: expr.text };
    }
    if (ts.isNumericLiteral(expr)) {
        return { kind: "number", value: Number(expr.text) };
    }
    if (expr.kind === ts.SyntaxKind.TrueKeyword) {
        return { kind: "boolean", value: true };
    }
    if (expr.kind === ts.SyntaxKind.FalseKeyword) {
        return { kind: "boolean", value: false };
    }
    if (expr.kind === ts.SyntaxKind.NullKeyword) {
        return { kind: "null" };
    }
    if (ts.isIdentifier(expr)) {
        return { kind: "identifier", name: expr.text };
    }
    if (ts.isPropertyAccessExpression(expr)) {
        return {
            kind: "property-access",
            object: expr.expression.getText(),
            property: expr.name.getText(),
        };
    }
    if (ts.isCallExpression(expr)) {
        return {
            kind: "call",
            callee: expr.expression.getText(),
            argumentCount: expr.arguments.length,
        };
    }
    if (ts.isArrayLiteralExpression(expr)) {
        return {
            kind: "array",
            itemCount: expr.elements.length,
            items: expr.elements.map(describe),
        };
    }
    if (ts.isObjectLiteralExpression(expr)) {
        return {
            kind: "object",
            propertyKeys: expr.properties.map(p => {
                if (ts.isPropertyAssignment(p)) {
                    return p.name.getText();
                }
                return p.getText();
            }),
        };
    }
    return { kind: "unknown", ast: expr.getText() };
}

function printDescription(d: ExpressionDescription): string {
    switch (d.kind) {
        case "string":
            return `kind: string, value: ${JSON.stringify(d.value)}`;
        case "number":
            return `kind: number, value: ${d.value}`;
        case "boolean":
            return `kind: boolean, value: ${d.value}`;
        case "null":
            return `kind: null`;
        case "identifier":
            return `kind: identifier, name: ${d.name}`;
        case "property-access":
            return `kind: property-access, object: ${d.object}, property: ${d.property}`;
        case "call":
            return `kind: call, callee: ${d.callee}, argumentCount: ${d.argumentCount}`;
        case "array":
            return `kind: array, itemCount: ${d.itemCount}, items: [${d.items
                .map(printDescription)
                .join(" | ")}]`;
        case "object":
            return `kind: object, propertyKeys: [${d.propertyKeys.join(", ")}]`;
        case "unknown":
            return `kind: unknown, ast: ${d.ast}`;
    }
}

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();

function printDecorator(
    decorator: ts.Decorator,
    context: string,
) {
    const args = decoratorArguments.get(decorator);
    const name = decoratorReader.getName(decorator) ?? "<unnamed>";
    console.log(`--- ${context} ---`);
    console.log(`Decorator: @${name}()`);
    console.log(`  argumentCount: ${args.length}`);
    if (args.length === 1) {
        const d = describe(args[0]);
        console.log(`  argument[0]: ${printDescription(d)}`);
    }
}

// ============================================================
// Part A — synthetic one-arg expression forms
// ============================================================
console.log(
    "\n===== D4 PART A — SYNTHETIC ONE-ARG EXPRESSION FORMS =====\n",
);

const syntheticSource = `
class OneArg {
    @Get("users") m1() {}
    @Get("") m2() {}
    @HttpCode(201) m3() {}
    @Decorator(true) m4() {}
    @Decorator(null) m5() {}
    @UseGuards(AuthGuard) m6() {}
    @HttpCode(HttpStatus.CREATED) m7() {}
    @Decorator(factory()) m8() {}
    @Decorator([AuthGuard, AdminGuard]) m9() {}
    @Decorator({ role: "admin", enabled: true }) m10() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-one-arg.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const classDec =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!classDec) {
    throw new Error("synthetic source had no class");
}

for (const member of classDec.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `OneArg.${methodName}`);
    }
}

// ============================================================
// Part B — real NestJS one-arg decorators from example-api
// ============================================================
console.log(
    "\n===== D4 PART B — REAL NESTJS ONE-ARG DECORATORS =====\n",
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

// Target specific real NestJS one-arg decorators by their containing
// class/method and decorator name.
type Target = {
    className: string;
    scope: "class" | "method";
    methodName?: string;
    decoratorName: string;
};

const targets: readonly Target[] = [
    {
        className: "ProductsController",
        scope: "class",
        decoratorName: "Controller",
    },
    {
        className: "ProductsController",
        scope: "method",
        methodName: "findOne",
        decoratorName: "Get",
    },
    {
        className: "OrdersController",
        scope: "method",
        methodName: "findOne",
        decoratorName: "Get",
    },
    {
        className: "ProductsController",
        scope: "method",
        methodName: "create",
        decoratorName: "HttpCode",
    },
    {
        className: "OrdersController",
        scope: "method",
        methodName: "create",
        decoratorName: "HttpCode",
    },
    {
        className: "CartController",
        scope: "method",
        methodName: "addItem",
        decoratorName: "HttpCode",
    },
    {
        className: "ProductsController",
        scope: "method",
        methodName: "remove",
        decoratorName: "HttpCode",
    },
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
];

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        for (const target of targets.filter(
            t => t.className === className,
        )) {
            if (target.scope === "class") {
                for (const d of decoratorReader.getDecorators(
                    classNode,
                )) {
                    if (
                        decoratorReader.getName(d) ===
                        target.decoratorName
                    ) {
                        printDecorator(
                            d,
                            `${className} (class scope)`,
                        );
                    }
                }
                continue;
            }
            // method scope
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
                        decoratorReader.getName(d) ===
                        target.decoratorName
                    ) {
                        printDecorator(
                            d,
                            `${className}.${methodNode.name.getText()} (method scope)`,
                        );
                    }
                }
            }
        }
    }
}

// ============================================================
// Part C — the @UseGuards(AuthGuard) vs
//          @UseGuards([AuthGuard, AdminGuard]) distinction
// ============================================================
console.log(
    "\n===== D4 PART C — IDENTIFIER vs ARRAY-AS-ONE-ARG =====\n",
);

const distinctionSource = `
class GuardsExample {
    @UseGuards(AuthGuard) identifierCase() {}
    @UseGuards([AuthGuard, AdminGuard]) arrayCase() {}
}
`;

const distinctionFile = ts.createSourceFile(
    "guards-distinction.ts",
    distinctionSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const guardClass =
    distinctionFile.statements.find(ts.isClassDeclaration);

if (!guardClass) {
    throw new Error("distinction source had no class");
}

for (const member of guardClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `GuardsExample.${member.name.getText()}`,
        );
    }
}

// ============================================================
// Part D — @Decorator(factory()) vs @Decorator([factory()])
// ============================================================
console.log(
    "\n===== D4 PART D — CALL-AS-ONE-ARG =====\n",
);

const callSource = `
class CallExample {
    @Decorator(factory()) callCase() {}
    @Decorator([AuthGuard, AdminGuard]) arrayWithCallCase() {}
}
`;

const callFile = ts.createSourceFile(
    "call-one-arg.ts",
    callSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const callClass =
    callFile.statements.find(ts.isClassDeclaration);

if (!callClass) {
    throw new Error("call source had no class");
}

for (const member of callClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `CallExample.${member.name.getText()}`,
        );
    }
}