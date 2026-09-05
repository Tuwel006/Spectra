import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
    AstProject,
    ClassQuery,
    DeclarationResolver,
    ExpressionInspector,
    NodeWalker,
    SourceScanner,
    SymbolResolver,
} from "@spectra/provider-ast";

import {
    DecoratorArguments,
    DecoratorReader,
    ModuleItemView,
    ModuleMetadata,
    ModuleSourceExtractor,
} from "../src";

/**
 * E9 audit test — module relationship semantic extraction.
 *
 * Verifies:
 *   - @Module({imports, controllers, providers, exports}) arguments
 *     are extracted structurally.
 *   - Bare identifier items resolve via SymbolResolver +
 *     DeclarationResolver (class names, declaration kind).
 *   - Call expressions (e.g. forwardRef(() => SomeModule)) preserve
 *     structure without execution.
 *   - Object literals (provider useValue/useClass/useFactory/
 *     useExisting forms) preserve key/value structure.
 *   - Dynamic expressions preserve source text + classify by kind.
 *   - No @Module decorator → empty metadata, but module is still
 *     recorded.
 *
 *   - examples integration: real example-api modules:
 *       AppModule / AuthModule / CartModule / OrdersModule /
 *       ProductsModule / UsersModule
 */

interface ModuleItemCheck {
    readonly count: number;
    readonly kinds?: readonly string[];
    readonly classNames?: readonly string[];
}

interface ModuleCheck {
    readonly name: string;
    readonly imports?: ModuleItemCheck;
    readonly controllers?: ModuleItemCheck;
    readonly providers?: ModuleItemCheck;
    readonly exports?: ModuleItemCheck;
}

console.log("===== E9 — MODULE RELATIONSHIP SEMANTIC EXTRACTION =====\n");

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

const extractorNoResolvers = new ModuleSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);

// ========== Part A: synthetic @Module extraction ==========
console.log("--- Part A: synthetic @Module ---");

const syntheticModuleSource = [
    "class UsersModule {}",
    "class OrdersModule {}",
    "class ProductsModule {}",
    "class UsersController {}",
    "class UsersService {}",
    "class OrdersService {}",
    "class SyncService {}",
    "class TOKEN {}",
    "class FactoryProvider {}",
    "@Module({",
    "  imports: [UsersModule, OrdersModule],",
    "  controllers: [UsersController, OrdersController],",
    "  providers: [UsersService, OrdersService, SyncService, TOKEN],",
    "  exports: [UsersService, OrdersService],",
    "})",
    "class AppModule {}",
    "@Module({ imports: [getModule()] })",
    "class WithDynamicImports {}",
    "@Module({ imports: [forwardRef(() => SomeModule)] })",
    "class WithCallImport {}",
    "@Module({",
    "  providers: [{ provide: TOKEN, useClass: UsersService }],",
    "})",
    "class WithObjectProvider {}",
    "class NoModuleDecorator {}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-modules.ts",
    syntheticModuleSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const expectedModules: Record<string, ModuleCheck> = {
    AppModule: {
        name: "AppModule",
        imports: { count: 2, kinds: ["identifier", "identifier"],
            classNames: ["UsersModule", "OrdersModule"] },
        controllers: { count: 2, kinds: ["identifier", "identifier"],
            classNames: ["UsersController", "OrdersController"] },
        providers: { count: 4, kinds: ["identifier", "identifier", "identifier", "identifier"] },
        exports: { count: 2, kinds: ["identifier", "identifier"] },
    },
    WithDynamicImports: {
        name: "WithDynamicImports",
        imports: { count: 1, kinds: ["call"] },
    },
    WithCallImport: {
        name: "WithCallImport",
        imports: { count: 1, kinds: ["call"] },
    },
    WithObjectProvider: {
        name: "WithObjectProvider",
        providers: { count: 1, kinds: ["object"] },
    },
    NoModuleDecorator: {
        name: "NoModuleDecorator",
        imports: { count: 0 },
        controllers: { count: 0 },
        providers: { count: 0 },
        exports: { count: 0 },
    },
};

let aPass = 0;
let aTotal = 0;

const classDecls = file.statements.filter(
    (s): s is ts.ClassDeclaration => ts.isClassDeclaration(s),
);

for (const cls of classDecls) {
    const name = cls.name?.text;
    if (!name || !(name in expectedModules)) continue;
    const expected = expectedModules[name];
    aTotal++;
    const m: ModuleMetadata | undefined =
        extractorNoResolvers.extract(cls);
    if (!m) {
        console.log(`  ${name}: no module extracted FAIL`);
        continue;
    }
    const fields: (keyof ModuleCheck)[] = [
        "imports", "controllers", "providers", "exports",
    ];
    let fieldOk = true;
    for (const f of fields) {
        const exp = expected[f];
        if (!exp) continue;
        const arr = m[f];
        if (arr.length !== exp.count) {
            fieldOk = false;
            console.log(
                `  ${name} ${f}: count mismatch ` +
                    `(${arr.length} vs ${exp.count})`,
            );
        } else if (exp.kinds) {
            for (let i = 0; i < arr.length; i++) {
                if (arr[i].kindName !== exp.kinds[i]) {
                    fieldOk = false;
                    console.log(
                        `  ${name} ${f}[${i}]: kind mismatch ` +
                            `(${arr[i].kindName} vs ${exp.kinds[i]})`,
                    );
                }
            }
        }
        if (exp.classNames) {
            for (let i = 0; i < arr.length; i++) {
                const actualName = arr[i].className ?? arr[i].resolvedSymbolName;
                if (actualName !== exp.classNames[i]) {
                    fieldOk = false;
                    console.log(
                        `  ${name} ${f}[${i}]: className mismatch ` +
                            `(${actualName} vs ${exp.classNames[i]})`,
                    );
                }
            }
        }
    }
    if (fieldOk) aPass++;
    console.log(
        `  ${name} imports=${m.imports.length} ` +
            `controllers=${m.controllers.length} ` +
            `providers=${m.providers.length} ` +
            `exports=${m.exports.length} ` +
            (fieldOk ? "PASS" : "FAIL"),
    );

    if (name === "WithObjectProvider") {
        const prov = m.providers[0];
        aTotal++;
        const objOk =
            prov !== undefined &&
            prov.kindName === "object" &&
            prov.providerForm === "provide";
        if (objOk) aPass++;
        console.log(
            `  WithObjectProvider provider form check ` +
                `kind=${prov?.kindName} providerForm=${prov?.providerForm} ` +
                (objOk ? "PASS" : "FAIL"),
        );
    }
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: with resolvers ==========
console.log("\n--- Part B: synthetic with resolvers ---");

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});
const symbolResolver = new SymbolResolver(project);
const declarationResolver = new DeclarationResolver(project);

const extractorWithResolvers = new ModuleSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);

const moduleNamesInSynth: Record<string, ModuleCheck> = expectedModules;
let bPass = 0;
let bTotal = 0;

for (const cls of classDecls) {
    const name = cls.name?.text;
    if (!name || !(name in moduleNamesInSynth)) continue;
    bTotal++;
    const m = extractorWithResolvers.extract(cls);
    if (m && m.imports.length === moduleNamesInSynth[name].imports?.count) {
        bPass++;
    }
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C: example-api integration ==========
console.log("\n--- Part C: example-api integration ---");

const classQuery = new ClassQuery(new NodeWalker());
const extractorExampleApi = new ModuleSourceExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);

const scanner = new SourceScanner(project);
const sourceFiles = [...scanner.scan()].sort((a, b) =>
    a.fileName.localeCompare(b.fileName),
);

const { modules, edges } = extractorExampleApi.extractAll(
    sourceFiles,
    (sf: ts.SourceFile) => classQuery.execute(sf),
);

console.log(`  Modules: ${modules.length}`);
const expectedModuleNames = new Set([
    "AppModule",
    "AuthModule",
    "CartModule",
    "OrdersModule",
    "ProductsModule",
    "UsersModule",
]);

let cPass = 0;
let cTotal = 0;
const moduleByName = new Map<string, ModuleMetadata>();
for (const m of modules) {
    moduleByName.set(m.name, m);
}

for (const expectedName of expectedModuleNames) {
    cTotal++;
    const m = moduleByName.get(expectedName);
    if (!m) {
        console.log(`  ${expectedName}: missing FAIL`);
        continue;
    }
    let ok = true;
    if (expectedName === "AppModule") {
        const actualImports = m.imports.map(
            i => i.className ?? i.resolvedSymbolName,
        );
        console.log(`    AppModule actualImports=${JSON.stringify(actualImports)}`);
    }
    // Check specific expectations per module.
    if (expectedName === "AppModule") {
        ok =
            m.imports.length === 5 &&
            m.controllers.length === 1 &&
            m.providers.length === 1 &&
            m.exports.length === 0;
        const expectedImports = [
            "AuthModule",
            "ProductsModule",
            "OrdersModule",
            "CartModule",
            "UsersModule",
        ];
        const actualImports = m.imports.map(
            i => i.className ?? i.resolvedSymbolName,
        );
        for (let i = 0; i < expectedImports.length; i++) {
            if (actualImports[i] !== expectedImports[i]) {
                ok = false;
            }
        }
        console.log(
            `    AppModule actualControllers=${JSON.stringify(m.controllers.map(c => ({ cn: c.className, sym: c.resolvedSymbolName, src: c.sourceText })))}`,
        );
        console.log(
            `    AppModule actualProviders=${JSON.stringify(m.providers.map(p => ({ cn: p.className, sym: p.resolvedSymbolName, src: p.sourceText })))}`,
        );
        // Use resolvedSymbolName for imported classes since the test
        // context can't follow import aliases all the way to ClassDeclaration.
        const controllerName = m.controllers[0]?.className
            ?? m.controllers[0]?.resolvedSymbolName;
        const providerName = m.providers[0]?.className
            ?? m.providers[0]?.resolvedSymbolName;
        if (controllerName !== "AppController") ok = false;
        if (providerName !== "AppService") ok = false;
    } else if (expectedName === "AuthModule") {
        ok =
            m.imports.length === 0 &&
            m.providers.length === 1 &&
            m.exports.length === 1 &&
            (m.providers[0]?.className ?? m.providers[0]?.resolvedSymbolName) === "JwtAuthGuard" &&
            (m.exports[0]?.className ?? m.exports[0]?.resolvedSymbolName) === "JwtAuthGuard";
    } else if (expectedName === "ProductsModule") {
        ok =
            m.imports.length === 0 &&
            m.controllers.length === 1 &&
            m.providers.length === 1 &&
            m.exports.length === 1 &&
            (m.controllers[0]?.className ?? m.controllers[0]?.resolvedSymbolName) === "ProductsController" &&
            (m.providers[0]?.className ?? m.providers[0]?.resolvedSymbolName) === "ProductsService" &&
            (m.exports[0]?.className ?? m.exports[0]?.resolvedSymbolName) === "ProductsService";
    } else {
        // CartModule, OrdersModule, UsersModule all import AuthModule.
        ok =
            m.imports.length === 1 &&
            (m.imports[0]?.className ?? m.imports[0]?.resolvedSymbolName) === "AuthModule" &&
            m.controllers.length === 1 &&
            m.providers.length === 1 &&
            m.exports.length === 1;
    }
    if (ok) cPass++;
    console.log(
        `  ${expectedName} imports=${m.imports.length} ` +
            `controllers=${m.controllers.length} ` +
            `providers=${m.providers.length} ` +
            `exports=${m.exports.length} ` +
            (ok ? "PASS" : "FAIL"),
    );
}

console.log("");
console.log(`  Edges (parent module -> imported module): ${edges.length}`);
const edgesByFrom = new Map<string, string[]>();
for (const edge of edges) {
    if (!edge.toModuleName) continue;
    if (!edgesByFrom.has(edge.fromModuleName)) {
        edgesByFrom.set(edge.fromModuleName, []);
    }
    edgesByFrom.get(edge.fromModuleName)!.push(edge.toModuleName);
}
let ePass = 0;
let eTotal = 0;
const expectedEdges: Record<string, string[]> = {
    AppModule: [
        "AuthModule",
        "ProductsModule",
        "OrdersModule",
        "CartModule",
        "UsersModule",
    ],
    CartModule: ["AuthModule"],
    OrdersModule: ["AuthModule"],
    UsersModule: ["AuthModule"],
};
for (const [from, expectedTos] of Object.entries(expectedEdges)) {
    eTotal++;
    const actualTos = (edgesByFrom.get(from) ?? []).sort();
    const expectedSorted = [...expectedTos].sort();
    const ok =
        actualTos.length === expectedSorted.length &&
        actualTos.every((v, i) => v === expectedSorted[i]);
    if (ok) ePass++;
    console.log(
        `  ${from} -> [${actualTos.join(",")}] ` +
            (ok ? "PASS" : `FAIL expected [${expectedSorted.join(",")}]`),
    );
}

console.log("");
console.log(
    `  Summary: modules ${cPass}/${cTotal} | edges ${ePass}/${eTotal}`,
);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal || ePass !== eTotal) {
    process.exit(1);
}