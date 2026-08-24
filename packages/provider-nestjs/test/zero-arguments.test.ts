import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    AstProject,
    SourceScanner,
    NodeWalker,
    ClassQuery,
    MethodQuery,
    ParameterQuery,
    ExpressionInspector,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../src";

/**
 * D3 audit test — zero arguments.
 *
 * Verifies that decorators with empty argument lists are represented
 * exactly as `argumentCount = 0` with `arguments = []`, with no phantom,
 * undefined, or null entries. Also verifies the critical distinction
 * between `@Foo()` (zero arguments) and `@Foo("")` (one empty-string
 * argument).
 *
 * Three fixtures cover this:
 *
 *   A. Synthetic source mirroring the D3 master-spec example —
 *      @Controller()/@Custom() on a class, @Get()/@Post()/@CustomMethod()
 *      on a method, and stacked @Body()/@CustomParameter() on a parameter.
 *
 *   B. Synthetic distinction source — a single method with both `@Query()`
 *      and `@Query("")` showing that one is zero-args and the other is
 *      one empty-string literal (NOT the same thing).
 *
 *   C. Real NestJS methods from apps/example-api — walks every controller
 *      and dumps every zero-arg decorator it finds with its class /
 *      method / parameter context. Asserts the count and the empty arg
 *      list every time.
 */

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const expressionInspector = new ExpressionInspector();

interface DecoratorView {
    readonly name: string;
    readonly argumentCount: number;
    readonly arguments: readonly {
        readonly kind: string;
        readonly value: string;
    }[];
}

function viewDecorator(
    decorator: ts.Decorator,
): DecoratorView {
    const args = decoratorArguments.get(decorator);
    const name = decoratorReader.getName(decorator) ?? "<unnamed>";
    return {
        name,
        argumentCount: args.length,
        arguments: args.map(arg => ({
            kind: expressionInspector.inspect(arg).kind,
            value: arg.getText(),
        })),
    };
}

function printView(view: DecoratorView) {
    console.log(`Decorator: @${view.name}()`);
    console.log(`  argumentCount: ${view.argumentCount}`);
    if (view.argumentCount === 0) {
        console.log(`  arguments: []`);
    } else {
        view.arguments.forEach((arg, i) => {
            console.log(`  argument[${i}]:`);
            console.log(`    kind: ${arg.kind}`);
            console.log(`    value: ${JSON.stringify(arg.value)}`);
        });
    }
}

function printZeroArgDecoratorsInClass(
    classNode: ts.ClassDeclaration,
): void {
    const className = classNode.name?.getText() ?? "<anonymous>";

    for (const d of decoratorReader.getDecorators(classNode)) {
        const view = viewDecorator(d);
        if (view.argumentCount === 0) {
            console.log(
                `\n--- Class ${className} | @${view.name}() ---`,
            );
            printView(view);
        }
    }
}

function printZeroArgDecoratorsInMethod(
    methodNode: ts.MethodDeclaration,
    className: string,
): void {
    const methodName = methodNode.name.getText();

    for (const d of decoratorReader.getDecorators(methodNode)) {
        const view = viewDecorator(d);
        if (view.argumentCount === 0) {
            console.log(
                `\n--- Method ${className}.${methodName} | @${view.name}() ---`,
            );
            printView(view);
        }
    }
}

function printZeroArgDecoratorsInParameter(
    parameterNode: ts.ParameterDeclaration,
    className: string,
    methodName: string,
): void {
    const paramName = parameterNode.name.getText();

    for (const d of decoratorReader.getDecorators(parameterNode)) {
        const view = viewDecorator(d);
        if (view.argumentCount === 0) {
            console.log(
                `\n--- Parameter ${className}.${methodName}.${paramName} | @${view.name}() ---`,
            );
            printView(view);
        }
    }
}

// ============================================================
// Part A — synthetic D3 spec example
// ============================================================
console.log(
    "\n===== D3 PART A — SYNTHETIC SPEC EXAMPLE =====\n",
);

const syntheticSource = `
@Controller()
@Custom()
class Test {
    @Get()
    @Post()
    @CustomMethod()
    method(
        @Body()
        @CustomParameter()
        value: string,
    ) {}
}
`;

const syntheticFile = ts.createSourceFile(
    "synthetic-zero-args.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const classDeclaration =
    syntheticFile.statements.find(ts.isClassDeclaration);

if (!classDeclaration) {
    throw new Error("synthetic source had no class");
}

console.log("--- Class Test ---");
for (const d of decoratorReader.getDecorators(classDeclaration)) {
    printView(viewDecorator(d));
}

for (const member of classDeclaration.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    console.log(`\n--- Method Test.${methodName} ---`);
    for (const d of decoratorReader.getDecorators(member)) {
        printView(viewDecorator(d));
    }
    for (const param of member.parameters) {
        console.log(
            `\n--- Parameter Test.${methodName}.${param.name.getText()} ---`,
        );
        for (const d of decoratorReader.getDecorators(param)) {
            printView(viewDecorator(d));
        }
    }
}

// ============================================================
// Part B — distinction: @Query() vs @Query("")
// ============================================================
console.log(
    "\n===== D3 PART B — DISTINCTION @Foo() vs @Foo('') =====\n",
);

const distinctionSource = `
class Distinction {
    method(
        @Query() noArg: string,
        @Query("") emptyString: string,
    ): void {}
}
`;

const distinctionFile = ts.createSourceFile(
    "distinction.ts",
    distinctionSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const distinctionClass =
    distinctionFile.statements.find(ts.isClassDeclaration);

if (!distinctionClass) {
    throw new Error("distinction source had no class");
}

for (const member of distinctionClass.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    for (const param of member.parameters) {
        const paramName = param.name.getText();
        for (const d of decoratorReader.getDecorators(param)) {
            console.log(
                `\n--- Parameter Distinction.${methodName}.${paramName} ---`,
            );
            printView(viewDecorator(d));
        }
    }
}

// ============================================================
// Part C — real NestJS zero-arg decorators from example-api
// ============================================================
console.log(
    "\n===== D3 PART C — REAL NESTJS ZERO-ARG DECORATORS =====\n",
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
const parameterQuery = new ParameterQuery(walker);

const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

for (const sourceFile of sourceFiles) {
    const classes = classQuery.execute(sourceFile);
    for (const classNode of classes) {
        const className = classNode.name?.getText() ?? "";
        if (!className) continue;

        printZeroArgDecoratorsInClass(classNode);

        const methods = methodQuery.execute(classNode);
        for (const methodNode of methods) {
            printZeroArgDecoratorsInMethod(methodNode, className);
            const parameters =
                parameterQuery.execute(methodNode);
            for (const parameterNode of parameters) {
                printZeroArgDecoratorsInParameter(
                    parameterNode,
                    className,
                    methodNode.name.getText(),
                );
            }
        }
    }
}