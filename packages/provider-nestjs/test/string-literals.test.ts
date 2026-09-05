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
 * D6 audit test — string literals.
 *
 * Verifies that string-literal decorator arguments are correctly recognized
 * and preserve both:
 *   - the AST source text (e.g. `"hello\nworld"` — escape sequences kept as
 *     written, surrounded by their original quotes), and
 *   - the semantic string value (e.g. `hello\nworld` — actual newline char).
 *
 * Three fixtures:
 *   A. Synthetic source mirroring the D6 spec example — double-quoted,
 *      single-quoted, empty, spaces, special characters, escapes.
 *   B. Real NestJS string-literal decorators from apps/example-api
 *      (@Controller("products"), @Get(":id"), @Post("register/test"),
 *       @Query("category"), @Param("id")).
 *   C. "No coercion" check — an identifier argument must remain an
 *      identifier; it must NOT be silently turned into a string.
 */

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();

interface StringView {
    readonly kind: "string";
    readonly value: string;        // semantic value (un-escaped)
    readonly sourceText: string;   // raw source text (with quotes + escapes)
    readonly astKind: string;      // ts.SyntaxKind of the literal node
    readonly isNoSubstitution: boolean; // confirms it's not a template literal
}

function stringView(arg: ts.Expression): StringView {
    if (!ts.isStringLiteral(arg)) {
        throw new Error(
            `expected StringLiteral, got ${ts.SyntaxKind[arg.kind]}`,
        );
    }
    return {
        kind: "string",
        value: arg.text,
        sourceText: arg.getText(),
        astKind: ts.SyntaxKind[arg.kind],
        isNoSubstitution: arg.kind === ts.SyntaxKind.StringLiteral,
    };
}

function viewArg(
    arg: ts.Expression,
):
    | StringView
    | {
          readonly kind: string;
          readonly note: string;
      } {
    if (ts.isStringLiteral(arg)) {
        return stringView(arg);
    }
    if (ts.isIdentifier(arg)) {
        return {
            kind: "identifier",
            note: "IDENTIFIER PRESERVED (no string coercion)",
        };
    }
    if (ts.isPropertyAccessExpression(arg)) {
        return {
            kind: "property-access",
            note: "PROPERTY-ACCESS PRESERVED (no string coercion)",
        };
    }
    return {
        kind: ts.SyntaxKind[arg.kind],
        note: `arg preserved as ${ts.SyntaxKind[arg.kind]}`,
    };
}

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
        const v = viewArg(arg);
        if (v.kind === "string") {
            console.log(`  argument[${i}]:`);
            console.log(`    kind: ${v.kind}`);
            console.log(`    value: ${JSON.stringify(v.value)}`);
            console.log(
                `    sourceText: ${JSON.stringify(v.sourceText)}`,
            );
            console.log(`    astKind: ${v.astKind}`);
            console.log(
                `    isNoSubstitution: ${v.isNoSubstitution}`,
            );
        } else {
            console.log(
                `  argument[${i}]: ${v.kind} — ${v.note}`,
            );
        }
    });
}

// ============================================================
// Part A — synthetic D6 spec cases
// ============================================================
console.log(
    "\n===== D6 PART A — SYNTHETIC STRING-LITERAL FORMS =====\n",
);

const syntheticSource = `
class StringLiterals {
    @Decorator("users")                              doubleQuoted() {}
    @Decorator('users')                              singleQuoted() {}
    @Decorator("")                                   empty() {}
    @Decorator("hello world")                        spaces() {}
    @Decorator("/users/:id")                         route1() {}
    @Decorator("hello-world")                        hyphenated() {}
    @Decorator("a/b")                                slash() {}
    @Decorator("a:b")                                colon() {}
    @Decorator("hello\\nworld")                      escapeNewline() {}
    @Decorator("hello\\tworld")                      escapeTab() {}
    @Decorator("quote: \\"test\\"")                  escapeQuote() {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-string-literal.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const stringClass =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!stringClass) {
    throw new Error("synthetic source had no class");
}

for (const member of stringClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(d, `StringLiterals.${methodName}`);
    }
}

// ============================================================
// Part B — real NestJS string-literal decorators from
//          apps/example-api
// ============================================================
console.log(
    "\n===== D6 PART B — REAL NESTJS STRING-LITERAL DECORATORS =====\n",
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

type Target = {
    className: string;
    methodName?: string;
    decoratorName: string;
    scope: "class" | "method";
};

const targets: readonly Target[] = [
    // Class-scope @Controller("path")
    { className: "CartController", decoratorName: "Controller", scope: "class" },
    { className: "OrdersController", decoratorName: "Controller", scope: "class" },
    { className: "ProductsController", decoratorName: "Controller", scope: "class" },
    { className: "UsersController", decoratorName: "Controller", scope: "class" },
    // Method-scope @Get(":id") and @Post("register/test")
    { className: "ProductsController", methodName: "findOne", decoratorName: "Get", scope: "method" },
    { className: "CartController", methodName: "removeItem", decoratorName: "Delete", scope: "method" },
    { className: "UsersController", methodName: "register", decoratorName: "Post", scope: "method" },
    // Method-scope @Query("category") (single arg method-scope only — queried via DecoratorReader)
    { className: "ProductsController", methodName: "findAll", decoratorName: "Query", scope: "method" },
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
                        const args = decoratorArguments.get(d);
                        if (args.length === 1 &&
                            ts.isStringLiteral(args[0])) {
                            printDecorator(
                                d,
                                `${className} (class scope)`,
                            );
                        }
                    }
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
                    if (args.length === 1 &&
                        ts.isStringLiteral(args[0])) {
                        printDecorator(
                            d,
                            `${className}.${methodNode.name.getText()}`,
                        );
                    }
                }
            }
        }
    }
}

// ============================================================
// Part C — no string coercion: identifiers stay identifiers,
//          property-accesses stay property-accesses
// ============================================================
console.log(
    "\n===== D6 PART C — NO STRING COERCION =====\n",
);

const coercionSource = `
class NoCoercion {
    @Decorator(AuthGuard)            identifierCase() {}
    @Decorator(HttpStatus.CREATED)   propertyAccessCase() {}
}
`;

const coercionFile = ts.createSourceFile(
    "no-coercion.ts",
    coercionSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const coercionClass =
    coercionFile.statements.find(ts.isClassDeclaration);

if (!coercionClass) {
    throw new Error("no-coercion source had no class");
}

for (const member of coercionClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `NoCoercion.${member.name.getText()}`,
        );
    }
}

// ============================================================
// Part D — @Decorator("") is argumentCount: 1 with value: "",
//          NOT zero-args (regression check vs D3)
// ============================================================
console.log(
    "\n===== D6 PART D — EMPTY STRING IS NOT ZERO ARGUMENTS =====\n",
);

const emptySource = `
class EmptyStringCase {
    @Decorator("")       emptyStringCase() {}
    @Decorator()          zeroArgCase() {}
}
`;

const emptyFile = ts.createSourceFile(
    "empty-string.ts",
    emptySource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const emptyClass =
    emptyFile.statements.find(ts.isClassDeclaration);

if (!emptyClass) {
    throw new Error("empty source had no class");
}

for (const member of emptyClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    for (const d of decoratorReader.getDecorators(member)) {
        printDecorator(
            d,
            `EmptyStringCase.${member.name.getText()}`,
        );
    }
}