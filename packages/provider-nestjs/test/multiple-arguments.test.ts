import ts from "typescript";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D5 audit test — multiple arguments.
 *
 * Verifies that decorators with multiple top-level arguments preserve:
 *   - exact argument count
 *   - exact argument order
 *   - each argument's expression type
 *   - nested expression structure
 *
 * Crucially, does NOT confuse nested array/object/call element counts with
 * the top-level decorator argument count.
 *
 * Three fixtures:
 *   A. Synthetic spec cases for each D5 case (two strings, mixed primitives,
 *      multiple identifiers, multiple property-access, multiple calls with
 *      nested argument counts, and the killer mixed-complex case).
 *   B. Order preservation across a 4-arg case (proving no sorting).
 *   C. Real-looking NestJS synthetic fixtures (since apps/example-api has
 *      no multi-arg NestJS decorators) — @UseGuards(AuthGuard, AdminGuard)
 *      and @Header("X-Trace", "true").
 *   D. Edge case: `@Decorator([A, B])` vs `@Decorator(A, B)` proving 1 vs
 *      2 top-level arguments.
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
            propertyKeys: expr.properties.map(p =>
                ts.isPropertyAssignment(p)
                    ? p.name.getText()
                    : p.getText(),
            ),
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
    args.forEach((arg, i) => {
        const d = describe(arg);
        console.log(`  argument[${i}]: ${printDescription(d)}`);
    });
}

// ============================================================
// Part A — synthetic D5 spec cases (each on its own method)
// ============================================================
console.log(
    "\n===== D5 PART A — SYNTHETIC MULTI-ARG CASES =====\n",
);

const syntheticSource = `
class Multi {
    @Decorator("first", "second")                         m1() {}
    @Decorator("users", 201, true, null)                  m2() {}
    @UseGuards(AuthGuard, AdminGuard)                     m3() {}
    @Decorator(HttpStatus.CREATED, HttpStatus.OK)         m4() {}
    @Decorator(factory(), otherFactory("x"))              m5() {}
    @Decorator(
        AuthGuard,
        ["a", "b"],
        { role: "admin" },
        factory(),
    )                                                     m6() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-multi-arg.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const multiClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!multiClass) {
    throw new Error("synthetic source had no class");
}

for (const member of multiClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `Multi.${methodName}`);
    }
}

// ============================================================
// Part B — order preservation across a 4-arg case
// ============================================================
console.log(
    "\n===== D5 PART B — ORDER PRESERVATION (NON-ALPHA) =====\n",
);

const orderSource = `
class OrderCase {
    @Decorator(gamma, alpha, beta, mu) m() {}
}
`;

const orderFile = ts.createSourceFile(
    "order-multi-arg.ts",
    orderSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const orderClass =
    orderFile.statements.find(ts.isClassDeclaration);

if (!orderClass) {
    throw new Error("order source had no class");
}

for (const member of orderClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `OrderCase.${member.name.getText()}`,
        );
    }
}

// ============================================================
// Part C — real-looking NestJS synthetic fixtures
// (example-api has no multi-arg NestJS decorators)
// ============================================================
console.log(
    "\n===== D5 PART C — REAL-LOOKING NESTJS MULTI-ARG =====\n",
);

const nestSource = `
class NestMulti {
    @UseGuards(AuthGuard, AdminGuard)             guardsCase() {}
    @Header("X-Trace", "true")                    headerCase() {}
    @SetMetadata("role", "admin")                 metadataCase() {}
}
`;

const nestFile = ts.createSourceFile(
    "nest-multi-arg.ts",
    nestSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const nestClass =
    nestFile.statements.find(ts.isClassDeclaration);

if (!nestClass) {
    throw new Error("nest source had no class");
}

for (const member of nestClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `NestMulti.${member.name.getText()}`,
        );
    }
}

// ============================================================
// Part D — the critical edge case: @Decorator([A, B]) vs
//          @Decorator(A, B) — 1 arg (array) vs 2 args
// ============================================================
console.log(
    "\n===== D5 PART D — ARRAY-AS-1-ARG vs 2-IDENTIFIERS =====\n",
);

const edgeSource = `
class Edge {
    @Decorator([AuthGuard, AdminGuard]) arrayCase() {}
    @Decorator(AuthGuard, AdminGuard)   flatCase() {}
    @Decorator([AuthGuard, [Inner]])    nestedArrayCase() {}
}
`;

const edgeFile = ts.createSourceFile(
    "edge-multi-arg.ts",
    edgeSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const edgeClass =
    edgeFile.statements.find(ts.isClassDeclaration);

if (!edgeClass) {
    throw new Error("edge source had no class");
}

for (const member of edgeClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `Edge.${member.name.getText()}`,
        );
    }
}