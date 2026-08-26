import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    ClassQuery,
    DeclarationResolver,
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    SourceScanner,
    SymbolResolver,
} from "@spectra/provider-ast";

import {
    ControllerAnalyzer,
    DecoratorArguments,
    DecoratorReader,
    FilterSourceExtractor,
    InterceptorSourceExtractor,
    PipeSourceExtractor,
    RouteAnalyzer,
} from "../src";

/**
 * E7 audit test — pipes / interceptors / filters.
 *
 * Verifies that for every @UsePipes / @UseInterceptors / @UseFilters
 * argument on a class or method, the analyzer produces a
 * `DecoratorArgView` (typed as PipeSourceView / etc.) carrying:
 *   - raw source text (preserved verbatim)
 *   - kind classification (identifier / call / array / object)
 *   - for identifier: symbol name + declaration kind
 *   - isStatic = true ONLY for bare identifier guards
 *
 * Cases:
 *   A. Synthetic @UsePipes (identifier, call, array, object)
 *   B. Synthetic @UseInterceptors
 *   C. Synthetic @UseFilters
 *   D. example-api integration (no example-api controllers currently
 *      use these decorators — synthetic coverage is the primary test)
 *
 * NEVER invokes pipes, interceptors, or filters.
 */

interface ArgCheck {
    readonly sourceText: string;
    readonly kindName: string;
    readonly isStatic: boolean;
    readonly childCount?: number;
}

console.log("===== E7 — PIPES / INTERCEPTORS / FILTERS =====\n");

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const pipeExtractor = new PipeSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);
const interceptorExtractor = new InterceptorSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);
const filterExtractor = new FilterSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);

// ========== Part A: synthetic ==========
console.log("--- Part A: synthetic (all three decorators) ---");

const syntheticSource = [
    "class ValidationPipe {}",
    "class LoggingInterceptor {}",
    "class ExceptionFilter {}",
    "class ControllerA {",
    "  m1() {}",
    "  @UsePipes(ValidationPipe) m2() {}",
    "  @UsePipes(ValidationPipe({ transform: true })) m3() {}",
    "  @UsePipes([ValidationPipe, ValidationPipe]) m4() {}",
    "  @UsePipes({ provide: ValidationPipe, useClass: ValidationPipe }) m5() {}",
    "  @UseInterceptors(LoggingInterceptor) m6() {}",
    "  @UseFilters(ExceptionFilter) m7() {}",
    "}",
    "@UsePipes(ValidationPipe)",
    "@UseInterceptors(LoggingInterceptor)",
    "@UseFilters(ExceptionFilter)",
    "class ControllerB {}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-pif.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const controllerA = file.statements.find(
    (s): s is ts.ClassDeclaration =>
        ts.isClassDeclaration(s) && s.name?.text === "ControllerA",
);
const controllerB = file.statements.find(
    (s): s is ts.ClassDeclaration =>
        ts.isClassDeclaration(s) && s.name?.text === "ControllerB",
);
if (!controllerA || !controllerB) throw new Error("missing controllers");

const expected: Record<string, ArgCheck[]> = {
    m2: [{
        sourceText: "ValidationPipe", kindName: "identifier",
        isStatic: true,
    }],
    m3: [{
        sourceText: "ValidationPipe({ transform: true })",
        kindName: "call", isStatic: false,
    }],
    m4: [{
        sourceText: "[ValidationPipe, ValidationPipe]",
        kindName: "array", isStatic: false, childCount: 2,
    }],
    m5: [{
        sourceText: "{ provide: ValidationPipe, useClass: ValidationPipe }",
        kindName: "object", isStatic: false,
    }],
    m6: [{
        sourceText: "LoggingInterceptor",
        kindName: "identifier", isStatic: true,
    }],
    m7: [{
        sourceText: "ExceptionFilter",
        kindName: "identifier", isStatic: true,
    }],
};

let aPass = 0;
let aTotal = 0;

for (const member of controllerA.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const checks = expected[methodName];
    if (!checks) continue;

    const pipes = pipeExtractor.extract(member);
    const interceptors = interceptorExtractor.extract(member);
    const filters = filterExtractor.extract(member);
    const all = [
        ...pipes.map(v => ({ kind: "pipes", ...v })),
        ...interceptors.map(v => ({ kind: "interceptors", ...v })),
        ...filters.map(v => ({ kind: "filters", ...v })),
    ];

    if (all.length !== checks.length) {
        aTotal += checks.length;
        console.log(
            `  ${methodName}: arg count mismatch (${all.length} vs ${checks.length}) FAIL`,
        );
        continue;
    }

    for (let i = 0; i < all.length; i++) {
        aTotal++;
        const v = all[i];
        const e = checks[i];
        const ok =
            v.sourceText === e.sourceText &&
            v.kindName === e.kindName &&
            v.isStatic === e.isStatic &&
            (e.childCount === undefined || v.children.length === e.childCount);
        if (ok) aPass++;
        console.log(
            `  ${methodName}[${i}] ${v.kind} src="${v.sourceText}" ` +
                `kind=${v.kindName} static=${v.isStatic} ` +
                `children=${v.children.length} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}

// ControllerB (class scope)
const classPipes = pipeExtractor.extract(controllerB);
const classInterceptors = interceptorExtractor.extract(controllerB);
const classFilters = filterExtractor.extract(controllerB);
aTotal += 3;
const okCp =
    classPipes.length === 1 &&
    classPipes[0].sourceText === "ValidationPipe" &&
    classPipes[0].kindName === "identifier";
const okCi =
    classInterceptors.length === 1 &&
    classInterceptors[0].sourceText === "LoggingInterceptor" &&
    classInterceptors[0].kindName === "identifier";
const okCf =
    classFilters.length === 1 &&
    classFilters[0].sourceText === "ExceptionFilter" &&
    classFilters[0].kindName === "identifier";
if (okCp) aPass++;
if (okCi) aPass++;
if (okCf) aPass++;
console.log(
    `  ControllerB class pipes=${classPipes.length} ` +
        `interceptors=${classInterceptors.length} ` +
        `filters=${classFilters.length} ` +
        (okCp && okCi && okCf ? "PASS" : "FAIL"),
);
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: with real resolvers ==========
console.log("\n--- Part B: synthetic with resolvers ---");

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});
const symbolResolver = new SymbolResolver(project);
const declarationResolver = new DeclarationResolver(project);

const pipeExtractorReal = new PipeSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);

let bPass = 0;
let bTotal = 0;

for (const member of controllerA.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const guards = pipeExtractorReal.extract(member);
    for (const g of guards) {
        bTotal++;
        const ok =
            typeof g.sourceText === "string" &&
            g.sourceText.length > 0 &&
            (g.kindName === "identifier" ||
                g.kindName === "call" ||
                g.kindName === "array" ||
                g.kindName === "object");
        if (ok) bPass++;
    }
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C: example-api scan ==========
console.log("\n--- Part C: example-api scan ---");

const classQuery = new ClassQuery(new NodeWalker());
const methodQuery = new MethodQuery(new NodeWalker());

const controllerAnalyzer = new ControllerAnalyzer(
    classQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);
const routeAnalyzer = new RouteAnalyzer(
    methodQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
    undefined,
    symbolResolver,
    declarationResolver,
);

const scanner = new SourceScanner(project);
const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

let cPass = 0;
let cTotal = 0;

for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) continue;
    const controllers = controllerAnalyzer.analyze(sourceFile);
    for (const controller of controllers) {
        const totalClassMeta =
            controller.classPipes.length +
            controller.classInterceptors.length +
            controller.classFilters.length;
        cTotal++;
        const ok = totalClassMeta === 0;
        if (ok) cPass++;
        if (totalClassMeta > 0) {
            console.log(
                `  ${controller.name} class pipes=${controller.classPipes.length} ` +
                    `interceptors=${controller.classInterceptors.length} ` +
                    `filters=${controller.classFilters.length} ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }
}
console.log(`  Summary: ${cPass}/${cTotal} example-api controllers with no pipes/interceptors/filters`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal) {
    process.exit(1);
}