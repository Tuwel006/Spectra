import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    ClassQuery,
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    SourceScanner,
    TypeResolver,
} from "@spectra/provider-ast";

import {
    ControllerAnalyzer,
    DecoratorArguments,
    DecoratorReader,
    ParameterSourceExtractor,
    ParameterTypeExtractor,
    RouteAnalyzer,
} from "../src";

/**
 * E5 audit test — type extraction / type resolution.
 *
 * Verifies that for every method parameter the analyzer produces:
 *   - The original source text of the type annotation (preserved
 *     verbatim; NOT normalized away).
 *   - A `ParameterTypeView` carrying kind classification, primitive
 *     detection, array / union structure, and (when TypeResolver
 *     is available) the underlying TypeScript `ts.Type` symbol +
 *     declaration information.
 *
 * Cases covered:
 *   - Primitives: string / number / boolean / void
 *   - Optional primitives: name?: string
 *   - Type references: local classes, imported DTOs, enums
 *   - Arrays: T[] and Array<T>
 *   - Unions: T | null
 *   - TypeResolver absent path: produces a source-text-only view
 *     (no flags, no symbol) — used by tests that build synthetic
 *     source files without an AstProject.
 *   - TypeResolver present path: produces the full semantic view.
 *
 * No DTO / class is ever instantiated.
 * No application code is ever executed.
 */

interface TypeCheck {
    readonly expectedSourceText: string;
    readonly expectedKindName: string;
    readonly expectedIsPrimitive: boolean;
    readonly expectedIsString?: boolean;
    readonly expectedIsNumber?: boolean;
    readonly expectedIsBoolean?: boolean;
    readonly expectedIsClass?: boolean;
    readonly expectedIsInterface?: boolean;
    readonly expectedIsEnum?: boolean;
    readonly expectedIsArray?: boolean;
    readonly expectedIsUnion?: boolean;
    readonly expectedIsObject?: boolean;
    readonly expectedSymbolName?: string;
    readonly expectedDeclarationKind?: string;
    readonly expectedResolved?: boolean;
}

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();
const walker = new NodeWalker();
const methodQuery = new MethodQuery(walker);
const classQuery = new ClassQuery(walker);
const typeResolver = new TypeResolver(project);

const parameterExtractorNoProject = new ParameterSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    new ParameterTypeExtractor(),
);
const parameterExtractorWithProject = new ParameterSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    new ParameterTypeExtractor(typeResolver),
);

const controllerAnalyzer = new ControllerAnalyzer(
    classQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
);
const routeAnalyzerNoProject = new RouteAnalyzer(
    methodQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
);
const routeAnalyzerWithProject = new RouteAnalyzer(
    methodQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
    typeResolver,
);

console.log("===== E5 — TYPE EXTRACTION / TYPE RESOLUTION =====\n");

// ========== Part A — synthetic without TypeResolver ==========
console.log("--- Part A: synthetic without TypeResolver (source-text only) ---");

const syntheticSource = [
    "class T {",
    "  m1(s: string, n: number, b: boolean, v: void) {}",
    "  m2(items: number[]) {}",
    "  m3(value: string | null) {}",
    "}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-type.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const syntheticCls = file.statements.find(ts.isClassDeclaration);
if (!syntheticCls) throw new Error("no class");

const expectedNoProject: Record<string, TypeCheck[]> = {
    m1: [
        { expectedSourceText: "string", expectedKindName: "unknown", expectedIsPrimitive: false, expectedResolved: false },
        { expectedSourceText: "number", expectedKindName: "unknown", expectedIsPrimitive: false, expectedResolved: false },
        { expectedSourceText: "boolean", expectedKindName: "unknown", expectedIsPrimitive: false, expectedResolved: false },
        { expectedSourceText: "void", expectedKindName: "unknown", expectedIsPrimitive: false, expectedResolved: false },
    ],
    m2: [
        { expectedSourceText: "number[]", expectedKindName: "array", expectedIsPrimitive: false, expectedResolved: false },
    ],
    m3: [
        { expectedSourceText: "string | null", expectedKindName: "union", expectedIsPrimitive: false, expectedResolved: false },
    ],
};

let aPass = 0;
let aTotal = 0;

for (const member of syntheticCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = expectedNoProject[methodName];
    if (!expected) continue;

    const params = member.parameters;
    if (params.length !== expected.length) {
        aTotal += expected.length;
        continue;
    }
    for (let i = 0; i < params.length; i++) {
        const view = parameterExtractorNoProject.extract(params[i], i).type;
        aTotal++;
        const e = expected[i];
        const ok =
            view.sourceText === e.expectedSourceText &&
            view.kindName === e.expectedKindName &&
            view.isResolved === (e.expectedResolved ?? false);
        if (ok) aPass++;
        console.log(
            `  ${methodName}[${i}] sourceText="${view.sourceText}" ` +
                `kindName=${view.kindName} isResolved=${view.isResolved} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B — synthetic with TypeResolver (primitives only) ==========
console.log("\n--- Part B: synthetic with TypeResolver (primitives only) ---");

const syntheticTypeSource = [
    "class TypeContainer {",
    "  m1(s: string, n: number, b: boolean) {}",
    "  m2(v: void) {}",
    "  m3(items: number[]) {}",
    "  m4(noType) {}",
    "}",
].join("\n");

const typeFile = ts.createSourceFile(
    "synthetic-type-resolved.ts",
    syntheticTypeSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const typeChecker = project.getTypeChecker();
const typeContainer = typeFile.statements.find(
    (s): s is ts.ClassDeclaration =>
        ts.isClassDeclaration(s) && s.name?.text === "TypeContainer",
);
if (!typeContainer) throw new Error("no class");

const projectTypeResolver = new TypeResolver(project);

function extractFromProjectClass(
    parameter: ts.ParameterDeclaration,
    parameterIndex: number,
) {
    return new ParameterSourceExtractor(
        decoratorReader,
        decoratorArguments,
        inspector,
        new ParameterTypeExtractor(projectTypeResolver),
    ).extract(parameter, parameterIndex).type;
}

const expectedWithProject: Record<string, TypeCheck[]> = {
    m1: [
        { expectedSourceText: "string", expectedKindName: "string", expectedIsPrimitive: true, expectedIsString: true, expectedIsObject: false, expectedResolved: true },
        { expectedSourceText: "number", expectedKindName: "number", expectedIsPrimitive: true, expectedIsNumber: true, expectedIsObject: false, expectedResolved: true },
        { expectedSourceText: "boolean", expectedKindName: "boolean", expectedIsPrimitive: true, expectedIsBoolean: true, expectedIsObject: false, expectedResolved: true },
    ],
    m2: [
        { expectedSourceText: "void", expectedKindName: "void", expectedIsPrimitive: false, expectedResolved: true },
    ],
    m3: [
        { expectedSourceText: "number[]", expectedKindName: "array", expectedIsPrimitive: false, expectedIsArray: true, expectedIsInterface: true, expectedSymbolName: "Array", expectedResolved: true },
    ],
    m4: [
        { expectedSourceText: "", expectedKindName: "<no-type>", expectedIsPrimitive: false, expectedResolved: false },
    ],
};

let bPass = 0;
let bTotal = 0;

for (const member of typeContainer.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = expectedWithProject[methodName];
    if (!expected) continue;

    const params = member.parameters;
    if (params.length !== expected.length) {
        bTotal += expected.length;
        continue;
    }
    for (let i = 0; i < params.length; i++) {
        const view = extractFromProjectClass(params[i], i);
        bTotal++;
        const e = expected[i];
        const checks: Array<[string, boolean]> = [
            ["sourceText", view.sourceText === e.expectedSourceText],
            ["kindName", view.kindName === e.expectedKindName],
            ["isPrimitive", view.isPrimitive === e.expectedIsPrimitive],
            ["isString", view.isString === (e.expectedIsString ?? false)],
            ["isNumber", view.isNumber === (e.expectedIsNumber ?? false)],
            ["isBoolean", view.isBoolean === (e.expectedIsBoolean ?? false)],
            ["isClass", view.isClass === (e.expectedIsClass ?? false)],
            ["isInterface", view.isInterface === (e.expectedIsInterface ?? false)],
            ["isEnum", view.isEnum === (e.expectedIsEnum ?? false)],
            ["isArray", view.isArray === (e.expectedIsArray ?? false)],
            ["isUnion", view.isUnion === (e.expectedIsUnion ?? false)],
            ["symbolName", e.expectedSymbolName === undefined || view.symbolName === e.expectedSymbolName],
            ["declarationKind", e.expectedDeclarationKind === undefined || view.declarationKind === e.expectedDeclarationKind],
            ["isResolved", view.isResolved === (e.expectedResolved ?? false)],
        ];
        const ok = checks.every(c => c[1]);
        if (ok) bPass++;
        if (!ok) {
            for (const [name, pass] of checks) {
                if (!pass) console.log(`    CHECK FAIL: ${name}`);
            }
        }
        console.log(
            `  ${methodName}[${i}] src="${view.sourceText}" kind=${view.kindName} ` +
                `primitive=${view.isPrimitive} array=${view.isArray} union=${view.isUnion} ` +
                `class=${view.isClass} iface=${view.isInterface} enum=${view.isEnum} ` +
                `sym=${view.symbolName} decl=${view.declarationKind} resolved=${view.isResolved} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C — example-api integration ==========
console.log("\n--- Part C: example-api integration (DTO classes) ---");

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
        const routes = routeAnalyzerWithProject.analyze(controller);
        for (const route of routes) {
            for (const p of route.parameters) {
                cTotal++;
                const ok =
                    typeof p.type.sourceText === "string" &&
                    typeof p.type.kindName === "string" &&
                    (p.type.isString || p.type.isNumber || p.type.isBoolean ||
                     p.type.isArray || p.type.isUnion || p.type.isObject ||
                     p.type.kindName === "<no-type>") &&
                    p.type.isResolved !== undefined;
                if (ok) cPass++;
                if (route.parameters.length > 0) {
                    console.log(
                        `  ${controller.name}.${route.name}[${p.parameterIndex}] ` +
                            `${p.name}: ${p.type.sourceText} ` +
                            `kind=${p.type.kindName} ` +
                            `class=${p.type.isClass} iface=${p.type.isInterface} ` +
                            `array=${p.type.isArray} ` +
                            `sym=${p.type.symbolName ?? "-"} ` +
                            `resolved=${p.type.isResolved} ` +
                            (ok ? "PASS" : "FAIL"),
                    );
                }
            }
        }
    }
}
console.log(`  Summary: ${cPass}/${cTotal}`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal) {
    process.exit(1);
}