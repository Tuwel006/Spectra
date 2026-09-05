import path from "node:path";
import { fileURLToPath } from "node:url";

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
    RouteAnalyzer,
    UnifiedSemanticExtractor,
} from "../src";

/**
 * E10 audit test — unified NestJS semantic model.
 *
 * Verifies that `UnifiedSemanticExtractor.extract()` composes all
 * E-step outputs into ONE immutable record per application:
 *   - modules (E9) → `modules: ModuleModel[]`
 *   - controllers (E1) → `controllers: ControllerModel[]`
 *   - operations (E2 + E3 + E4 + E5 + E6 + E7 + E8) → `operations: RouteOperation[]`
 *   - moduleEdges (E9) → `moduleEdges: ModuleImportEdge[]`
 *
 * Verifies:
 *   - Synthetic: every field populated correctly.
 *   - example-api: 6 modules, all controllers discovered, all routes
 *     discovered, module-controller wiring populated.
 *
 * NEVER executes application code.
 */

console.log("===== E10 — UNIFIED NESTJS SEMANTIC MODEL =====\n");

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();
const walker = new NodeWalker();
const classQuery = new ClassQuery(walker);
const methodQuery = new MethodQuery(walker);

// ========== Part A: synthetic ==========
console.log("--- Part A: synthetic (all fields composed) ---");

const syntheticSource = [
    "class UsersModule {}",
    "class OrdersModule {}",
    "class JwtAuthGuard {}",
    "class UsersController {}",
    "class OrdersController {}",
    "class UsersService {}",
    "@Module({",
    "  imports: [OrdersModule],",
    "  controllers: [UsersController],",
    "  providers: [UsersService, JwtAuthGuard],",
    "  exports: [UsersService],",
    "})",
    "class UsersFeatureModule {}",
    "@Module({ imports: [UsersFeatureModule] })",
    "class AppModule {}",
    "@Get() list() {}",
    "@Post() create() {}",
    "class NoOpController {}",
].join("\n");

const { createSourceFile } = await import("typescript");
const synthFile = createSourceFile(
    "synthetic-e10.ts",
    syntheticSource,
    99,
    true,
    3, // ScriptKind.TS
);

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});
const symbolResolver = new SymbolResolver(project);
const declarationResolver = new DeclarationResolver(project);

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
    new (await import("@spectra/provider-ast")).TypeResolver(project),
    symbolResolver,
    declarationResolver,
);

// Build a synthetic ModuleSourceExtractor-like for the synth file
// by instantiating ModuleSourceExtractor directly.
const { ModuleSourceExtractor } = await import("../src");
const moduleExtractor = new ModuleSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);

const unifiedA = new UnifiedSemanticExtractor(
    controllerAnalyzer,
    routeAnalyzer,
    moduleExtractor,
);

const synthSfs: any[] = [synthFile];
const synthModel = unifiedA.extract(synthSfs, (sf: any) =>
    classQuery.execute(sf),
);

let aPass = 0;
let aTotal = 0;

aTotal++;
const a_ok =
    synthModel.version.length > 0 &&
    typeof synthModel.builtAt === "string" &&
    synthModel.modules.length === 2 &&
    synthModel.operations.length === 2 &&
    synthModel.moduleEdges.length === 2;
if (a_ok) aPass++;
console.log(
    `  version=${synthModel.version} builtAt=${synthModel.builtAt} ` +
        `modules=${synthModel.modules.length} ` +
        `operations=${synthModel.operations.length} ` +
        `moduleEdges=${synthModel.moduleEdges.length} ` +
        (a_ok ? "PASS" : "FAIL"),
);

const moduleNames = synthModel.modules.map(m => m.name).sort();
aTotal++;
const a_ok2 =
    JSON.stringify(moduleNames) ===
    JSON.stringify(["AppModule", "UsersFeatureModule"]);
if (a_ok2) aPass++;
console.log(`  Module names: ${moduleNames.join(",")} ${a_ok2 ? "PASS" : "FAIL"}`);

const appModule = synthModel.modules.find(m => m.name === "AppModule");
aTotal++;
const synthAppModule = synthModel.modules.find(m => m.name === "AppModule");
const synthUsersFeatureModule = synthModel.modules.find(
    m => m.name === "UsersFeatureModule",
);
const synthAppModuleImports = (synthAppModule?.imports ?? []).map(
    (i: any) => i.className ?? i.resolvedSymbolName ?? i.sourceText,
);
const synthUfmControllers = (synthUsersFeatureModule?.controllers ?? []).map(
    (c: any) => c.className ?? c.resolvedSymbolName ?? c.sourceText,
);
const a_ok3 =
    synthAppModule !== undefined &&
    synthAppModuleImports.length === 1 &&
    synthAppModuleImports[0] === "UsersFeatureModule" &&
    synthUfmControllers.includes("UsersController");
if (a_ok3) aPass++;
console.log(
    `  appModule.imports=${synthAppModuleImports.join(",") || "?"} ` +
        `ufm.controllers=${synthUfmControllers.join(",") || "?"} ` +
        (a_ok3 ? "PASS" : "FAIL"),
);

const appEdges = synthModel.moduleEdges.filter(
    e => e.fromModuleName === "AppModule",
);
aTotal++;
const a_ok4 =
    appEdges.length === 1 &&
    (appEdges[0].item.className ?? appEdges[0].item.resolvedSymbolName ??
        appEdges[0].item.sourceText) === "UsersFeatureModule";
if (a_ok4) aPass++;
console.log(
    `  AppModule edges: ` +
        appEdges.map(e => {
            const name =
                e.item.className ?? e.item.resolvedSymbolName ?? e.item.sourceText;
            return `${e.fromModuleName}->${name}`;
        }).join(",") +
        " " + (a_ok4 ? "PASS" : "FAIL"),
);

const appOps = synthModel.operations.filter(
    o => o.controllerName === "NoOpController",
);
aTotal++;
const a_ok5 =
    appOps.length === 2 &&
    appOps[0].httpMethod === "GET" &&
    appOps[1].httpMethod === "POST" &&
    appOps.every(o => o.identityKey.startsWith("NoOpController."));
if (a_ok5) aPass++;
console.log(
    `  NoOpController ops=${appOps.length} ` +
        appOps.map(o => `${o.methodName}#${o.httpMethod}`).join(",") +
        " " + (a_ok5 ? "PASS" : "FAIL"),
);

console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: example-api integration ==========
console.log("\n--- Part B: example-api integration ---");

const realControllerAnalyzer = new ControllerAnalyzer(
    classQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);
const realRouteAnalyzer = new RouteAnalyzer(
    methodQuery,
    decoratorReader,
    decoratorArguments,
    inspector,
    new (await import("@spectra/provider-ast")).TypeResolver(project),
    symbolResolver,
    declarationResolver,
);
const realModuleExtractor = new ModuleSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);
const realUnified = new UnifiedSemanticExtractor(
    realControllerAnalyzer,
    realRouteAnalyzer,
    realModuleExtractor,
);

const scanner = new SourceScanner(project);
const realSfs = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

const realModel = realUnified.extract(realSfs, (sf: any) =>
    classQuery.execute(sf),
);

let bPass = 0;
let bTotal = 0;

bTotal++;
const b_ok =
    realModel.version.length > 0 &&
    typeof realModel.builtAt === "string" &&
    realModel.modules.length === 6 &&
    realModel.controllers.length > 0 &&
    realModel.operations.length > 0 &&
    realModel.moduleEdges.length > 0;
if (b_ok) bPass++;
console.log(
    `  version=${realModel.version} builtAt=${realModel.builtAt.slice(0, 19)} ` +
        `modules=${realModel.modules.length} ` +
        `controllers=${realModel.controllers.length} ` +
        `operations=${realModel.operations.length} ` +
        `moduleEdges=${realModel.moduleEdges.length} ` +
        (b_ok ? "PASS" : "FAIL"),
);

const expectedModules = new Set([
    "AppModule",
    "AuthModule",
    "CartModule",
    "OrdersModule",
    "ProductsModule",
    "UsersModule",
]);
bTotal++;
const realModuleNames = new Set(realModel.modules.map(m => m.name));
const b_ok2 =
    expectedModules.size === realModuleNames.size &&
    [...expectedModules].every(n => realModuleNames.has(n));
if (b_ok2) bPass++;
console.log(
    `  All 6 expected modules present: ${b_ok2 ? "PASS" : "FAIL"}`,
);

const expectedControllerCount = new Set(
    realModel.controllers.map(c => c.name),
);
bTotal++;
const expectedControllers = [
    "AppController",
    "ProductsController",
    "OrdersController",
    "CartController",
    "UsersController",
    "AuthController",
    "RootController",
];
const b_ok3 = expectedControllers.every(c =>
    expectedControllerCount.has(c),
);
if (b_ok3) bPass++;
console.log(
    `  All 7 expected controllers present: ${b_ok3 ? "PASS" : "FAIL"}`,
);

bTotal++;
const totalOps = realModel.operations.length;
const operationsWithComposition = realModel.operations.filter(
    o => o.composedPath.startsWith("/") && !o.composedPath.includes("//"),
);
const b_ok4 =
    totalOps > 0 &&
    operationsWithComposition.length === totalOps;
if (b_ok4) bPass++;
console.log(
    `  Composed paths well-formed: ${operationsWithComposition.length}/${totalOps} ` +
        (b_ok4 ? "PASS" : "FAIL"),
);

const productFindOne = realModel.operations.find(
    o =>
        o.controllerName === "ProductsController" &&
        o.methodName === "findOne",
);
bTotal++;
const b_ok5 =
    productFindOne !== undefined &&
    productFindOne.composedPath === "/products/:id" &&
    productFindOne.routeNormalizedPath === ":id" &&
    productFindOne.httpMethod === "GET" &&
    productFindOne.parameters.length >= 1;
if (b_ok5) bPass++;
console.log(
    `  ProductsController.findOne: composedPath="${productFindOne?.composedPath}" ` +
        `httpMethod=${productFindOne?.httpMethod} ` +
        `parameters=${productFindOne?.parameters.length} ` +
        (b_ok5 ? "PASS" : "FAIL"),
);

const usersGetProfile = realModel.operations.find(
    o =>
        o.controllerName === "UsersController" &&
        o.methodName === "getProfile",
);
bTotal++;
const b_ok6 =
    usersGetProfile !== undefined &&
    usersGetProfile.guards.length === 1 &&
    usersGetProfile.guards[0].sourceText === "JwtAuthGuard" &&
    usersGetProfile.moduleName === "UsersModule";
if (b_ok6) bPass++;
console.log(
    `  UsersController.getProfile: moduleName=${usersGetProfile?.moduleName} ` +
        `guards=${usersGetProfile?.guards.length} ` +
        (b_ok6 ? "PASS" : "FAIL"),
);

const appModuleReal = realModel.modules.find(m => m.name === "AppModule");
bTotal++;
const expectedChildModules = [
    "AuthModule",
    "CartModule",
    "OrdersModule",
    "ProductsModule",
    "UsersModule",
];
const realImportNames = (appModuleReal?.imports ?? [])
    .map(i => i.className ?? i.resolvedSymbolName)
    .sort();
const b_ok7 =
    appModuleReal !== undefined &&
    JSON.stringify(realImportNames) ===
        JSON.stringify([...expectedChildModules].sort());
if (b_ok7) bPass++;
console.log(
    `  AppModule.imports: ${realImportNames.join(",") || "?"} ` +
        (b_ok7 ? "PASS" : "FAIL"),
);

console.log(`  Summary: ${bPass}/${bTotal}`);

if (aPass !== aTotal || bPass !== bTotal) {
    process.exit(1);
}