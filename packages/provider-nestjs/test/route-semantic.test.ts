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
} from "@spectra/provider-ast";

import {
    ControllerAnalyzer,
    DecoratorArguments,
    DecoratorReader,
    RouteAnalyzer,
    RoutePathExtractor,
    composeRoutePath,
    normalizeRoutePath,
} from "../src";

/**
 * E2 audit test — Route semantic extraction.
 *
 * Verifies:
 *   - HTTP-verb normalization (Get / Post / Put / Patch / Delete /
 *     Options / Head / All) to the HttpMethod enum.
 *   - Route path source preservation + normalized component.
 *   - Multiple HTTP decorators on the same method are NOT merged —
 *     each produces its own RouteMetadata entry with the correct
 *     decoratorIndex.
 *   - Non-string-literal arguments (identifier / property-access /
 *     call / template / etc.) keep their AST source text and
 *     expression kind; isStatic = false; no invented concrete path.
 *   - Composition with controller path:
 *       "" + ""            -> "/"
 *       "" + "users"       -> "/users"
 *       "users" + ""        -> "/users"
 *       "users" + ":id"     -> "/users/:id"
 *       "/users/" + "/profile/" -> "/users/profile"
 *   - Integration with apps/example-api (ProductsController,
 *     OrdersController, CartController, UsersController, AuthController,
 *     RootController).
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
const pathExtractor = new RoutePathExtractor(
    decoratorArguments,
    inspector,
);
const routeAnalyzer = new RouteAnalyzer(
    new MethodQuery(new NodeWalker()),
    decoratorReader,
    decoratorArguments,
    inspector,
);
const classQuery = new ClassQuery(new NodeWalker());
const controllerAnalyzer = new ControllerAnalyzer(
    classQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
);

const sourceFiles = [...project.getSourceFiles()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

console.log(
    "  sourceFiles count =",
    sourceFiles.length,
    " (example-api files =",
    sourceFiles.filter(f => f.fileName.includes("example-api")).length,
    ")",
);

console.log("===== E2 — ROUTE SEMANTIC EXTRACTION =====\n");

// ========== Part A — synthetic normalization rules ==========
console.log("--- Part A: normalizeRoutePath rules ---");
const normCases: ReadonlyArray<readonly [string, string]> = [
    ["", ""],
    ["/", ""],
    ["users", "users"],
    ["/users", "users"],
    ["users/", "users"],
    ["/users/", "users"],
    ["a//b", "a/b"],
    ["api/v1", "api/v1"],
    ["/api/v1/users/:id", "api/v1/users/:id"],
];

let aPass = 0;
let aTotal = 0;
for (const [input, expected] of normCases) {
    aTotal++;
    const actual = normalizeRoutePath(input);
    const ok = actual === expected;
    if (ok) aPass++;
    console.log(
        `  "${input}".padEnd(20) -> "${actual}"`.padEnd(45) +
            (ok ? "PASS" : `FAIL expected "${expected}"`),
    );
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B — composition rules ==========
console.log("\n--- Part B: composeRoutePath rules ---");
const composeCases: ReadonlyArray<
    readonly [string, string, string]
> = [
    ["", "", "/"],
    ["users", "", "/users"],
    ["", "users", "/users"],
    ["users", ":id", "/users/:id"],
    ["/users/", "/profile/", "/users/profile"],
    ["api/v1", "users/:id", "/api/v1/users/:id"],
    ["", "", "/"],
];

let bPass = 0;
let bTotal = 0;
for (const [c, m, expected] of composeCases) {
    bTotal++;
    const actual = composeRoutePath(c, m);
    const ok = actual === expected;
    if (ok) bPass++;
    console.log(
        `  ("${c}", "${m}") -> "${actual}"`.padEnd(50) +
            (ok ? "PASS" : `FAIL expected "${expected}"`),
    );
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C — synthetic route semantic extraction ==========
console.log("\n--- Part C: synthetic route extraction ---");

const synthSource = `
class SynthController {
    @Get()                       m1() {}
    @Get("")                     m2() {}
    @Get("/")                    m3() {}
    @Get("users")                m4() {}
    @Get("/users/")              m5() {}
    @Get("users/:id")            m6() {}
    @Post()                      m7() {}
    @Put()                       m8() {}
    @Patch()                     m9() {}
    @Delete()                    m10() {}
    @Options()                   m11() {}
    @Head()                      m12() {}
    @All()                       m13() {}
    @Get("a") @Post("b")         m14Multi() {}
    @Get(routeVariable)          m15Id() {}
    @Get(HttpStatus.CREATED)     m16Prop() {}
    @Get(factory())              m17Call() {}
    @Get(` + "`" + `template` + "`" + `)            m18Template() {}
    @HttpCode(201)               m19HttpCode() {}
}
`;

const synthFile = ts.createSourceFile(
    "synthetic-routes.ts",
    synthSource,
    ts.ScriptTarget.Latest,
    true,
    ts.SyntaxKind.TS,
);
const synthCls = synthFile.statements.find(ts.isClassDeclaration);
if (!synthCls) throw new Error("no class");

interface ExpectedRoute {
    readonly methodName: string;
    readonly decoratorName: string;
    readonly decoratorIndex: number;
    readonly httpMethod: string;
    readonly sourcePath: string | undefined;
    readonly expressionKind: string;
    readonly value: string | undefined;
    readonly normalized: string;
    readonly isStatic: boolean;
}

const expectedRoutes: Record<string, ExpectedRoute[]> = {
    m1: [
        {
            methodName: "m1",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m2: [
        {
            methodName: "m2",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '""',
            expressionKind: "string",
            value: "",
            normalized: "",
            isStatic: true,
        },
    ],
    m3: [
        {
            methodName: "m3",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '"/"',
            expressionKind: "string",
            value: "/",
            normalized: "",
            isStatic: true,
        },
    ],
    m4: [
        {
            methodName: "m4",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '"users"',
            expressionKind: "string",
            value: "users",
            normalized: "users",
            isStatic: true,
        },
    ],
    m5: [
        {
            methodName: "m5",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '"/users/"',
            expressionKind: "string",
            value: "/users/",
            normalized: "users",
            isStatic: true,
        },
    ],
    m6: [
        {
            methodName: "m6",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '"users/:id"',
            expressionKind: "string",
            value: "users/:id",
            normalized: "users/:id",
            isStatic: true,
        },
    ],
    m7: [
        {
            methodName: "m7",
            decoratorName: "Post",
            decoratorIndex: 0,
            httpMethod: "POST",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m8: [
        {
            methodName: "m8",
            decoratorName: "Put",
            decoratorIndex: 0,
            httpMethod: "PUT",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m9: [
        {
            methodName: "m9",
            decoratorName: "Patch",
            decoratorIndex: 0,
            httpMethod: "PATCH",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m10: [
        {
            methodName: "m10",
            decoratorName: "Delete",
            decoratorIndex: 0,
            httpMethod: "DELETE",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m11: [
        {
            methodName: "m11",
            decoratorName: "Options",
            decoratorIndex: 0,
            httpMethod: "OPTIONS",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m12: [
        {
            methodName: "m12",
            decoratorName: "Head",
            decoratorIndex: 0,
            httpMethod: "HEAD",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m13: [
        {
            methodName: "m13",
            decoratorName: "All",
            decoratorIndex: 0,
            httpMethod: "ALL",
            sourcePath: undefined,
            expressionKind: "<zero-args>",
            value: undefined,
            normalized: "",
            isStatic: true,
        },
    ],
    m14Multi: [
        {
            methodName: "m14Multi",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: '"a"',
            expressionKind: "string",
            value: "a",
            normalized: "a",
            isStatic: true,
        },
        {
            methodName: "m14Multi",
            decoratorName: "Post",
            decoratorIndex: 1,
            httpMethod: "POST",
            sourcePath: '"b"',
            expressionKind: "string",
            value: "b",
            normalized: "b",
            isStatic: true,
        },
    ],
    m15Id: [
        {
            methodName: "m15Id",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: "routeVariable",
            expressionKind: "identifier",
            value: undefined,
            normalized: "",
            isStatic: false,
        },
    ],
    m16Prop: [
        {
            methodName: "m16Prop",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: "HttpStatus.CREATED",
            expressionKind: "property-access",
            value: undefined,
            normalized: "",
            isStatic: false,
        },
    ],
    m17Call: [
        {
            methodName: "m17Call",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: "factory()",
            expressionKind: "call",
            value: undefined,
            normalized: "",
            isStatic: false,
        },
    ],
    m18Template: [
        {
            methodName: "m18Template",
            decoratorName: "Get",
            decoratorIndex: 0,
            httpMethod: "GET",
            sourcePath: "`template`",
            expressionKind: "template",
            value: undefined,
            normalized: "",
            isStatic: false,
        },
    ],
    m19HttpCode: [],
};

let cPass = 0;
let cTotal = 0;

for (const member of synthCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = expectedRoutes[methodName];
    if (!expected) continue;

    const views = routeAnalyzer
        .analyze({
            name: synthCls.name?.text ?? "",
            path: "",
            sourcePath: undefined,
            normalizedPath: "",
            controllerExpressionKind: "<synthetic>",
            controllerPathValue: undefined,
            classNode: synthCls,
            version: undefined,
            tags: [],
            routes: [],
        })
        .filter(r => r.name === methodName);

    if (expected.length === 0) {
        // m19HttpCode has @HttpCode but no @Get/etc — expect zero routes
        if (views.length === 0) {
            cPass++;
            console.log(
                `  ${methodName.padEnd(15)} no HTTP verb -> 0 routes PASS`,
            );
        } else {
            cTotal++;
            console.log(
                `  ${methodName.padEnd(15)} unexpected routes FAIL`,
            );
        }
        cTotal++;
        continue;
    }

    cTotal += expected.length;
    for (let i = 0; i < expected.length; i++) {
        const e = expected[i];
        const v = views[i];
        if (!v) {
            console.log(`  ${methodName}[${i}] missing route FAIL`);
            continue;
        }
        const ok =
            v.decoratorName === e.decoratorName &&
            v.decoratorIndex === e.decoratorIndex &&
            v.method === e.httpMethod &&
            v.sourcePath === e.sourcePath &&
            v.routeExpressionKind === e.expressionKind &&
            v.routePathValue === e.value &&
            v.normalizedPath === e.normalized &&
            v.isStatic === e.isStatic;
        if (ok) cPass++;
        console.log(
            `  ${methodName}[${i}] ${v.decoratorName}@${v.decoratorIndex} ` +
                `method=${v.method} sourcePath=${String(JSON.stringify(v.sourcePath))} ` +
                `kind=${v.routeExpressionKind} value=${JSON.stringify(v.routePathValue)} ` +
                `normalized=${JSON.stringify(v.normalizedPath)} ` +
                `static=${v.isStatic} ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${cPass}/${cTotal}`);

// ========== Part D — integration with apps/example-api ==========
console.log("\n--- Part D: example-api integration ---");

const targetControllers = new Set([
    "ProductsController",
    "OrdersController",
    "CartController",
    "UsersController",
    "AuthController",
    "RootController",
    "AppController",
]);

let dPass = 0;
let dTotal = 0;

for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) continue;
    const controllers = controllerAnalyzer.analyze(sourceFile);
    for (const controller of controllers) {
        if (!targetControllers.has(controller.name)) continue;
        const routes = routeAnalyzer.analyze(controller);
        for (const route of routes) {
            dTotal++;
            const ok =
                typeof route.method === "string" &&
                route.method.length > 0 &&
                typeof route.composedPath === "string" &&
                route.composedPath.length > 0 &&
                typeof route.name === "string" &&
                route.name.length > 0;
            if (ok) dPass++;
            console.log(
                `  ${controller.name}.${route.name} ` +
                    `decorator=${route.decoratorName} ` +
                    `method=${route.method} ` +
                    `sourcePath=${String(JSON.stringify(route.sourcePath))} ` +
                    `kind=${route.routeExpressionKind} ` +
                    `composed=${JSON.stringify(route.composedPath)} ` +
                    `static=${route.isStatic} ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }
}
console.log(`  Summary: ${dPass}/${dTotal}`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal || dPass !== dTotal) {
    process.exit(1);
}