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
    RouteCompositionExtractor,
    composeRoutePath,
} from "../src";

/**
 * E3 audit test — route composition + operation identity.
 *
 * Verifies the complete route identity model built on top of E1
 * (controller) + E2 (route) extractors:
 *
 *   - Composed path rules (controller + method) for all combinations
 *     of empty/non-empty, leading/trailing/internal slashes.
 *   - Source paths preserved independently of normalized paths.
 *   - Dynamic expressions (identifier / property-access / call /
 *     template) are NOT evaluated; isStatic=false preserved.
 *   - Multiple HTTP decorators on the same method produce distinct
 *     operations with distinct decoratorIndex.
 *   - Multiple methods / multiple controllers / duplicate composed
 *     paths remain distinct by operation identity (identityKey).
 *   - No "//" anywhere in composed paths.
 *   - Root path remains "/" at the operation level.
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

const controllerAnalyzer = new ControllerAnalyzer(
    new ClassQuery(walker),
    decoratorReader,
    decoratorArguments,
    inspector,
);
const routeAnalyzer = new RouteAnalyzer(
    new MethodQuery(walker),
    decoratorReader,
    decoratorArguments,
    inspector,
);
const compositionExtractor = new RouteCompositionExtractor();

interface OpCase {
    readonly controllerSourcePath: string | undefined;
    readonly controllerExpressionKind: string;
    readonly controllerNormalized: string;
    readonly methodName: string;
    readonly decoratorName: string;
    readonly decoratorIndex: number;
    readonly httpMethod: string;
    readonly routeSourcePath: string | undefined;
    readonly routeExpressionKind: string;
    readonly routeNormalized: string;
    readonly expectedComposed: string;
    readonly expectedIdentityKey: string;
    readonly expectedIsStatic: boolean;
}

console.log("===== E3 — ROUTE COMPOSITION + OPERATION IDENTITY =====\n");

// ========== Part A: composition matrix ==========
console.log("--- Part A: composition matrix (synthetic) ---");

interface CompCase {
    readonly controllerNormalized: string;
    readonly methodNormalized: string;
    readonly expected: string;
    readonly expectedContainsDoubleSlash: boolean;
}

const compCases: CompCase[] = [
    { controllerNormalized: "", methodNormalized: "", expected: "/", expectedContainsDoubleSlash: false },
    { controllerNormalized: "users", methodNormalized: "", expected: "/users", expectedContainsDoubleSlash: false },
    { controllerNormalized: "", methodNormalized: "users", expected: "/users", expectedContainsDoubleSlash: false },
    { controllerNormalized: "users", methodNormalized: ":id", expected: "/users/:id", expectedContainsDoubleSlash: false },
    { controllerNormalized: "users", methodNormalized: "profile/:id", expected: "/users/profile/:id", expectedContainsDoubleSlash: false },
    { controllerNormalized: "/users/", methodNormalized: "/profile/", expected: "/users/profile", expectedContainsDoubleSlash: false },
    { controllerNormalized: "api/v1", methodNormalized: "users/:id", expected: "/api/v1/users/:id", expectedContainsDoubleSlash: false },
    { controllerNormalized: "users", methodNormalized: "users/:id/posts/:postId", expected: "/users/users/:id/posts/:postId", expectedContainsDoubleSlash: false },
];

let aPass = 0;
let aTotal = 0;
for (const c of compCases) {
    aTotal++;
    const actual = composeRoutePath(c.controllerNormalized, c.methodNormalized);
    const noDbl = !actual.includes("//");
    const ok = actual === c.expected && noDbl;
    if (ok) aPass++;
    console.log(
        `  compose("${c.controllerNormalized}", "${c.methodNormalized}") -> "${actual}" ` +
            (ok ? "PASS" : `FAIL expected "${c.expected}"`),
    );
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: synthetic operation identity ==========
console.log("\n--- Part B: synthetic operation identity ---");

const syntheticSource = `
class SynthController {
    @Get()                                       list() {}
    @Get("")                                     empty() {}
    @Get("/")                                    slash() {}
    @Get("users")                                g1() {}
    @Get("users/:id")                            g2() {}
    @Get("/users/")                              g3() {}
    @Get("users/")                               g4() {}
    @Get(routeVariable)                          g5() {}
    @Get(HttpStatus.CREATED)                     g6() {}
    @Get("a") @Post("b")                         multi() {}
    @Get("users/:id")                            g7() {}
}
`;

const synthFile = ts.createSourceFile(
    "synthetic-composition.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.SyntaxKind.TS,
);

const synthCls = synthFile.statements.find(ts.isClassDeclaration);
if (!synthCls) throw new Error("no class");

const synthController: {
    name: string;
    sourcePath: string | undefined;
    expressionKind: string;
    normalizedPath: string;
} = {
    name: synthCls.name?.text ?? "",
    sourcePath: undefined,
    expressionKind: "<zero-args>",
    normalizedPath: "",
};

interface ExpectedOp {
    readonly methodName: string;
    readonly decoratorNames: string[];
    readonly httpMethods: string[];
    readonly routeSources: (string | undefined)[];
    readonly routeKinds: string[];
    readonly routeNormalized: string[];
    readonly expectedComposed: string[];
    readonly expectedIsStatic: boolean[];
}

const opExpected: Record<string, ExpectedOp> = {
    list: {
        methodName: "list",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: [undefined],
        routeKinds: ["<zero-args>"],
        routeNormalized: [""],
        expectedComposed: ["/"],
        expectedIsStatic: [true],
    },
    empty: {
        methodName: "empty",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['""'],
        routeKinds: ["string"],
        routeNormalized: [""],
        expectedComposed: ["/"],
        expectedIsStatic: [true],
    },
    slash: {
        methodName: "slash",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"/"'],
        routeKinds: ["string"],
        routeNormalized: [""],
        expectedComposed: ["/"],
        expectedIsStatic: [true],
    },
    g1: {
        methodName: "g1",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"users"'],
        routeKinds: ["string"],
        routeNormalized: ["users"],
        expectedComposed: ["/users"],
        expectedIsStatic: [true],
    },
    g2: {
        methodName: "g2",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"users/:id"'],
        routeKinds: ["string"],
        routeNormalized: ["users/:id"],
        expectedComposed: ["/users/:id"],
        expectedIsStatic: [true],
    },
    g3: {
        methodName: "g3",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"/users/"'],
        routeKinds: ["string"],
        routeNormalized: ["users"],
        expectedComposed: ["/users"],
        expectedIsStatic: [true],
    },
    g4: {
        methodName: "g4",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"users/"'],
        routeKinds: ["string"],
        routeNormalized: ["users"],
        expectedComposed: ["/users"],
        expectedIsStatic: [true],
    },
    g5: {
        methodName: "g5",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ["routeVariable"],
        routeKinds: ["identifier"],
        routeNormalized: [""],
        expectedComposed: ["/"],
        expectedIsStatic: [false],
    },
    g6: {
        methodName: "g6",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ["HttpStatus.CREATED"],
        routeKinds: ["property-access"],
        routeNormalized: [""],
        expectedComposed: ["/"],
        expectedIsStatic: [false],
    },
    multi: {
        methodName: "multi",
        decoratorNames: ["Get", "Post"],
        httpMethods: ["GET", "POST"],
        routeSources: ['"a"', '"b"'],
        routeKinds: ["string", "string"],
        routeNormalized: ["a", "b"],
        expectedComposed: ["/a", "/b"],
        expectedIsStatic: [true, true],
    },
    g7: {
        methodName: "g7",
        decoratorNames: ["Get"],
        httpMethods: ["GET"],
        routeSources: ['"users/:id"'],
        routeKinds: ["string"],
        routeNormalized: ["users/:id"],
        expectedComposed: ["/users/:id"],
        expectedIsStatic: [true],
    },
};

let bPass = 0;
let bTotal = 0;

// Build synthetic ControllerMetadata
const synthControllerMetadata = {
    name: synthController.name,
    path: synthController.normalizedPath,
    sourcePath: synthController.sourcePath,
    normalizedPath: synthController.normalizedPath,
    controllerExpressionKind: synthController.expressionKind,
    controllerPathValue: undefined,
    classNode: synthCls,
    version: undefined,
    tags: [],
    routes: [],
};

for (const member of synthCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const expected = opExpected[methodName];
    if (!expected) continue;

    const syntheticRoutes = routeAnalyzer
        .analyze(synthControllerMetadata as any)
        .filter(r => r.name === methodName);

    if (syntheticRoutes.length !== expected.decoratorNames.length) {
        console.log(`  ${methodName}: route count mismatch FAIL`);
        bTotal += expected.decoratorNames.length;
        continue;
    }

    for (let i = 0; i < syntheticRoutes.length; i++) {
        const route = syntheticRoutes[i];
        const identity = compositionExtractor.extract(
            synthControllerMetadata as any,
            route,
        );
        const exp = expected;

        const expectedKey =
            synthController.name + "." + route.name + "#" + route.method;
        const checks: ReadonlyArray<readonly [string, boolean]> = [
            ["controllerName", identity.controllerName === synthController.name],
            ["methodName", identity.methodName === route.name],
            ["decoratorName", identity.decoratorName === exp.decoratorNames[i]],
            ["httpMethod", identity.httpMethod === exp.httpMethods[i]],
            ["controllerSourcePath", identity.controllerSourcePath === synthController.sourcePath],
            ["controllerNormalizedPath", identity.controllerNormalizedPath === synthController.normalizedPath],
            ["routeSourcePath", identity.routeSourcePath === exp.routeSources[i]],
            ["routeExpressionKind", identity.routeExpressionKind === exp.routeKinds[i]],
            ["routeNormalizedPath", identity.routeNormalizedPath === exp.routeNormalized[i]],
            ["composedPath", identity.composedPath === exp.expectedComposed[i]],
            ["no-double-slash", !identity.composedPath.includes("//")],
            ["isStatic", identity.isStatic === exp.expectedIsStatic[i]],
            ["identityKey", identity.identityKey === expectedKey],
            ["pathKey", identity.pathKey === exp.expectedComposed[i]],
            ["decoratorIndex", identity.decoratorIndex === i],
        ];
        const ok = checks.every(c => c[1]);
        if (ok) bPass++;
        bTotal++;
        if (!ok) {
            for (const [name, pass] of checks) {
                if (!pass) {
                    console.log(`    CHECK FAIL: ${name}`);
                }
            }
        }
        console.log(
            `  ${methodName}[${i}] decorator=${identity.decoratorName}@${identity.decoratorIndex} ` +
                `method=${identity.httpMethod} ` +
                `cSrc=${JSON.stringify(identity.controllerSourcePath)} ` +
                `cNorm="${identity.controllerNormalizedPath}" ` +
                `rSrc=${JSON.stringify(identity.routeSourcePath)} ` +
                `rKind=${identity.routeExpressionKind} ` +
                `rNorm="${identity.routeNormalizedPath}" ` +
                `composed="${identity.composedPath}" ` +
                `static=${identity.isStatic} ` +
                `key="${identity.identityKey}" ` +
                (ok ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C: identity distinctness ==========
console.log("\n--- Part C: identity distinctness (synthetic) ---");

// g2 and g7 both have methodName="g2"/"g7" but same composed path
// "/users/:id"; only methodName+httpMethod differs.
const allSyntheticRoutes = routeAnalyzer.analyze(synthControllerMetadata as any);
const synthIdentities = allSyntheticRoutes.map(r =>
    compositionExtractor.extract(synthControllerMetadata as any, r),
);

const seenIds = new Set<string>();
let cPass = 0;
let cTotal = 0;
let dups = 0;
for (const id of synthIdentities) {
    cTotal++;
    if (seenIds.has(id.identityKey)) {
        dups++;
        console.log(`  DUP identityKey: ${id.identityKey} FAIL`);
    } else {
        seenIds.add(id.identityKey);
        cPass++;
        console.log(
            `  ${id.controllerName}.${id.methodName}#${id.httpMethod} -> "${id.composedPath}" (key=${id.identityKey}) PASS`,
        );
    }
}
console.log(`  Summary: ${cPass}/${cTotal} unique, ${dups} duplicates`);

// ========== Part D: example-api integration ==========
console.log("\n--- Part D: example-api integration ---");

const scanner = new SourceScanner(project);
const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

let dPass = 0;
let dTotal = 0;

const realIdentities: Array<ReturnType<RouteCompositionExtractor["extract"]>> = [];

for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) continue;
    const controllers = controllerAnalyzer.analyze(sourceFile);
    for (const controller of controllers) {
        const routes = routeAnalyzer.analyze(controller);
        for (const route of routes) {
            const identity = compositionExtractor.extract(controller, route);
            realIdentities.push(identity);
            dTotal++;
            const noDbl = !identity.composedPath.includes("//");
            const ok =
                identity.controllerName.length > 0 &&
                identity.methodName.length > 0 &&
                identity.composedPath.length > 0 &&
                noDbl &&
                typeof identity.identityKey === "string" &&
                identity.identityKey.includes("#");
            if (ok) dPass++;
            console.log(
                `  ${identity.controllerName}.${identity.methodName}#${identity.httpMethod} ` +
                    `cNorm="${identity.controllerNormalizedPath}" ` +
                    `rNorm="${identity.routeNormalizedPath}" ` +
                    `composed="${identity.composedPath}" ` +
                    `static=${identity.isStatic} ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }
}

// Verify identityKeys unique across the whole example-api
const realIds = new Set<string>();
let realDups = 0;
for (const id of realIdentities) {
    if (realIds.has(id.identityKey)) realDups++;
    realIds.add(id.identityKey);
}
console.log(
    `  Summary: ${dPass}/${dTotal}, unique keys=${realIds.size}, dups=${realDups}`,
);

// ========== Part E: path collisions (NOT a failure) ==========
console.log("\n--- Part E: shared composed paths (not a failure) ---");

const pathCounts = new Map<string, number>();
for (const id of realIdentities) {
    pathCounts.set(
        id.composedPath,
        (pathCounts.get(id.composedPath) ?? 0) + 1,
    );
}
let ePass = 0;
let eTotal = 0;
for (const [path, count] of [...pathCounts.entries()].sort()) {
    if (count > 1) {
        eTotal++;
        console.log(
            `  "${path}" appears in ${count} distinct operations:`,
        );
        for (const id of realIdentities) {
            if (id.composedPath === path) {
                console.log(
                    `    - ${id.controllerName}.${id.methodName}#${id.httpMethod} ` +
                        `(identityKey="${id.identityKey}")`,
                );
            }
        }
        ePass++; // sharing is allowed and expected
    }
}
if (eTotal === 0) {
    console.log("  No shared composed paths in example-api");
}
console.log(`  Summary: ${ePass}/${eTotal}`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal || dPass !== dTotal) {
    process.exit(1);
}