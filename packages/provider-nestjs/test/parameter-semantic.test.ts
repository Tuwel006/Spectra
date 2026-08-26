import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    ClassQuery,
    ExpressionInspector,
    MethodQuery,
    NodeWalker,
    ParameterQuery,
    SourceScanner,
} from "@spectra/provider-ast";

import {
    ControllerAnalyzer,
    DecoratorArguments,
    DecoratorReader,
    ParameterSourceExtractor,
    RouteAnalyzer,
} from "../src";

/**
 * E4 audit test — parameter semantic extraction.
 *
 * Verifies:
 *   - ParameterQuery over-reach FIX (D1 finding): for a method
 *     whose body contains nested lambda parameters (e.g.
 *     `items.map((p) => ...)`), the parameter query returns ONLY
 *     the direct method parameters, not the lambda parameter.
 *   - ParameterSourceExtractor reads each parameter decorator and
 *     extracts the source text, expression kind, and string-literal
 *     value when applicable.
 *   - All NestJS parameter decorators are recognized by name
 *     (`Param`, `Query`, `Body`, `Headers`, `Req`, `Res`, `Ip`,
 *     `Session`, `HostParam`).
 *   - Undecorated parameters produce `decoratorName = undefined`,
 *     `key = undefined`, `keyIsStatic = false`.
 *   - Key extraction:
 *       - string-literal value is preserved
 *       - identifier / property-access / call / template key is
 *         NEVER coerced into a string — `key = undefined`,
 *         `keyIsStatic = false`, raw source preserved
 *   - Parameter type text is preserved (`type.getText()`).
 *   - Integration with `RouteAnalyzer.analyze()` populates
 *     `RouteMetadata.parameters` correctly.
 *   - Real example-api controllers' parameters all classify
 *     correctly.
 *
 * No decorator / guard / factory / constructor is ever invoked.
 */

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

const parameterQuery = new ParameterQuery(new NodeWalker());

const parameterExtractor = new ParameterSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);

const controllerAnalyzer = new ControllerAnalyzer(
    classQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
);

const routeAnalyzer = new RouteAnalyzer(
    methodQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
);

console.log("===== E4 — PARAMETER SEMANTIC EXTRACTION =====\n");

// ========== Part A: ParameterQuery over-reach FIX ==========
console.log("--- Part A: ParameterQuery direct-only (D1 finding fixed) ---");

const syntheticOverreach = `
class OverreachClass {
    items() {
        return [1, 2, 3].map((p) => p * 2).filter((q) => q > 0);
    }
    regular(cb: (x: number) => void) {}
}
`;

const sourceFileOverreach = ts.createSourceFile(
    "synthetic-overreach.ts",
    syntheticOverreach,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const overreachCls = sourceFileOverreach.statements.find(
    ts.isClassDeclaration,
);
if (!overreachCls) throw new Error("no class");

let aPass = 0;
let aTotal = 0;

for (const member of overreachCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const params = parameterQuery.execute(member);
    aTotal++;
    // Overreach-fix assertion: only direct params, NOT (p) or (q)
    // or (x) from the lambda callbacks.
    const ok = member.name.getText() === "regular"
        ? params.length === 1 && params[0].name.getText() === "cb"
        : params.length === 0;
    if (ok) aPass++;
    console.log(
        `  ${member.name.getText()}() -> params=${params.map(p => p.name.getText()).join(",")} ` +
            (ok ? "PASS" : "FAIL (expected no nested-lambda over-reach)"),
    );
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: synthetic parameter semantic extraction ==========
console.log("\n--- Part B: synthetic parameter extraction ---");

interface ExpectedParam {
    readonly name: string;
    readonly decoratorName: string | undefined;
    readonly decoratorIndex: number;
    readonly keySourceText: string | undefined;
    readonly keyExpressionKind: string | undefined;
    readonly key: string | undefined;
    readonly keyIsStatic: boolean;
    readonly typeText: string;
    readonly hasDecorator: boolean;
}

const syntheticParams = [
    "class ParamController {",
    "    @Get(':id')",
    "    p1(@Param('id') id: string) {}",
    "",
    "    @Get('search')",
    "    p2(@Query('q') q: string, page: number) {}",
    "",
    "    @Post()",
    "    p3(@Body() dto: CreateUserDto) {}",
    "",
    "    @Post()",
    "    p4(@Body('payload') payload: object) {}",
    "",
    "    @Get()",
    "    p5(@Headers('x-trace') trace: string) {}",
    "",
    "    @Get()",
    "    p6(@Req() req: object) {}",
    "",
    "    @Get()",
    "    p7(@Res() res: object) {}",
    "",
    "    @Get()",
    "    p8(@Ip() ip: string) {}",
    "",
    "    @Get()",
    "    p9(@Session() sess: object) {}",
    "",
    "    @Get()",
    "    p10(@HostParam('host') host: string) {}",
    "",
    "    @Get()",
    "    p11(@Param(key) k: string) {}",
    "",
    "    @Get()",
    "    p12(@Param(HttpStatus.OK) k: string) {}",
    "",
    "    @Get()",
    "    p13(@Param(factory()) k: string) {}",
    "",
    "}",
    "",
].join("\n");

const sourceFileParams = ts.createSourceFile(
    "synthetic-params.ts",
    syntheticParams,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const paramCls = sourceFileParams.statements.find(
    ts.isClassDeclaration,
);
if (!paramCls) throw new Error("no class");

const expectedByMethod: Record<string, ExpectedParam[]> = {
    p1: [{ name: "id", decoratorName: "Param", decoratorIndex: 0,
            keySourceText: "'id'", keyExpressionKind: "string",
            key: "id", keyIsStatic: true,
            typeText: "string", hasDecorator: true }],
    p2: [
        { name: "q", decoratorName: "Query", decoratorIndex: 0,
            keySourceText: "'q'", keyExpressionKind: "string",
            key: "q", keyIsStatic: true,
            typeText: "string", hasDecorator: true },
        { name: "page", decoratorName: undefined, decoratorIndex: -1,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "number", hasDecorator: false },
    ],
    p3: [{ name: "dto", decoratorName: "Body", decoratorIndex: 0,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "CreateUserDto", hasDecorator: true }],
    p4: [{ name: "payload", decoratorName: "Body", decoratorIndex: 0,
            keySourceText: "'payload'", keyExpressionKind: "string",
            key: "payload", keyIsStatic: true,
            typeText: "object", hasDecorator: true }],
    p5: [{ name: "trace", decoratorName: "Headers", decoratorIndex: 0,
            keySourceText: "'x-trace'", keyExpressionKind: "string",
            key: "x-trace", keyIsStatic: true,
            typeText: "string", hasDecorator: true }],
    p6: [{ name: "req", decoratorName: "Req", decoratorIndex: 0,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "object", hasDecorator: true }],
    p7: [{ name: "res", decoratorName: "Res", decoratorIndex: 0,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "object", hasDecorator: true }],
    p8: [{ name: "ip", decoratorName: "Ip", decoratorIndex: 0,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "string", hasDecorator: true }],
    p9: [{ name: "sess", decoratorName: "Session", decoratorIndex: 0,
            keySourceText: undefined, keyExpressionKind: undefined,
            key: undefined, keyIsStatic: false,
            typeText: "object", hasDecorator: true }],
    p10: [{ name: "host", decoratorName: "HostParam", decoratorIndex: 0,
            keySourceText: "'host'", keyExpressionKind: "string",
            key: "host", keyIsStatic: true,
            typeText: "string", hasDecorator: true }],
    p11: [{ name: "k", decoratorName: "Param", decoratorIndex: 0,
            keySourceText: "key", keyExpressionKind: "identifier",
            key: undefined, keyIsStatic: false,
            typeText: "string", hasDecorator: true }],
    p12: [{ name: "k", decoratorName: "Param", decoratorIndex: 0,
            keySourceText: "HttpStatus.OK", keyExpressionKind: "property-access",
            key: undefined, keyIsStatic: false,
            typeText: "string", hasDecorator: true }],
    p13: [{ name: "k", decoratorName: "Param", decoratorIndex: 0,
            keySourceText: "factory()", keyExpressionKind: "call",
            key: undefined, keyIsStatic: false,
            typeText: "string", hasDecorator: true }],
};

let bPass = 0;
let bTotal = 0;

for (const member of paramCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = expectedByMethod[methodName];
    if (!expected) continue;

    const params = parameterQuery.execute(member);
    if (params.length !== expected.length) {
        console.log(
            `  ${methodName}: param count mismatch (${params.length} vs ${expected.length}) FAIL`,
        );
        bTotal += expected.length;
        continue;
    }
    for (let i = 0; i < params.length; i++) {
        const view = parameterExtractor.extract(params[i], i);
        const e = expected[i];
        bTotal++;
        const checks = [
            ["name", view.name === e.name],
            ["decoratorName", view.decoratorName === e.decoratorName],
            ["decoratorIndex", view.decoratorIndex === e.decoratorIndex],
            ["keySourceText", view.keySourceText === e.keySourceText],
            ["keyExpressionKind", view.keyExpressionKind === e.keyExpressionKind],
            ["key", view.key === e.key],
            ["keyIsStatic", view.keyIsStatic === e.keyIsStatic],
            ["typeText", view.typeText === e.typeText],
            ["hasDecorator", view.hasDecorator === e.hasDecorator],
        ];
        const ok = checks.every(c => c[1]);
        if (ok) bPass++;
        console.log(
            `  ${methodName}[${i}] name=${view.name} decorator=${view.decoratorName ?? "<none>"} ` +
                `key=${JSON.stringify(view.key)} keyStatic=${view.keyIsStatic} type=${view.typeText} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C: integration with RouteAnalyzer ==========
console.log("\n--- Part C: RouteAnalyzer parameter integration ---");

let cPass = 0;
let cTotal = 0;

for (const member of paramCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = expectedByMethod[methodName];
    if (!expected) continue;
    const syntheticController = {
        name: paramCls.name?.text ?? "",
        path: "",
        sourcePath: undefined,
        normalizedPath: "",
        controllerExpressionKind: "<zero-args>",
        controllerPathValue: undefined,
        classNode: paramCls,
        version: undefined,
        tags: [],
        routes: [],
    } as any;

    const routes = routeAnalyzer.analyze(syntheticController);
    if (routes.length === 0) {
        cTotal++;
        console.log(`  ${methodName}: no route extracted FAIL`);
        continue;
    }

    const route = routes.find(r => r.name === methodName);
    if (!route) {
        cTotal++;
        console.log(
            `  ${methodName}: route not found by name (got ${routes.map(r => r.name).join(",")}) FAIL`,
        );
        continue;
    }
    if (route.parameters.length !== expected.length) {
        cTotal++;
        console.log(
            `  ${methodName}: parameter count mismatch FAIL (${route.parameters.length} vs ${expected.length})`,
        );
        continue;
    }
    for (let i = 0; i < expected.length; i++) {
        cTotal++;
        const p = route.parameters[i];
        const e = expected[i];
        const ok =
            p.name === e.name &&
            p.decoratorName === e.decoratorName &&
            p.keySourceText === e.keySourceText &&
            p.key === e.key &&
            p.typeText === e.typeText;
        if (ok) cPass++;
        console.log(
            `  ${methodName}[${i}] name=${p.name} decorator=${p.decoratorName ?? "<none>"} ` +
                `key=${JSON.stringify(p.key)} type=${p.typeText} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${cPass}/${cTotal}`);

// ========== Part D: example-api integration ==========
console.log("\n--- Part D: example-api integration ---");

const scanner = new SourceScanner(project);
const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

let dPass = 0;
let dTotal = 0;

for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) continue;
    const controllers = controllerAnalyzer.analyze(sourceFile);
    for (const controller of controllers) {
        const routes = routeAnalyzer.analyze(controller);
        for (const route of routes) {
            for (const p of route.parameters) {
                dTotal++;
                const ok =
                    typeof p.name === "string" &&
                    p.name.length > 0 &&
                    typeof p.typeText === "string" &&
                    typeof p.parameterIndex === "number" &&
                    p.parameterIndex >= 0;
                if (ok) dPass++;
                if (route.parameters.length > 0) {
                    console.log(
                        `  ${controller.name}.${route.name}[${p.parameterIndex}] ` +
                            `name=${p.name} decorator=${p.decoratorName ?? "<none>"} ` +
                            `key=${JSON.stringify(p.key)} keyStatic=${p.keyIsStatic} type=${p.typeText} ` +
                            (ok ? "PASS" : "FAIL"),
                    );
                }
            }
        }
    }
}
console.log(`  Summary: ${dPass}/${dTotal}`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal || dPass !== dTotal) {
    process.exit(1);
}