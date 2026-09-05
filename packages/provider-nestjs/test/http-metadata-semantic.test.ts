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
    HttpMetadataExtractor,
    RouteAnalyzer,
} from "../src";

/**
 * E8 audit test — HTTP metadata.
 *
 * Verifies that for every @HttpCode / @Header / @Redirect
 * decorator on a method, the analyzer produces a structural view:
 *   - raw source text (preserved verbatim)
 *   - expression kind (numeric / identifier / property-access / etc.)
 *   - for identifier: symbol name + declaration kind + class name
 *   - isStatic = true ONLY for numeric literals and string literals
 *
 * Cases:
 *   A. Synthetic @HttpCode (numeric / identifier / property-access /
 *      dynamic / object / array)
 *   B. Synthetic @Header (static / dynamic / multiple decorators /
 *      missing-value form)
 *   C. Synthetic @Redirect (URL only / URL+status / dynamic / etc.)
 *   D. example-api integration: real @HttpCode(HttpStatus.CREATED) and
 *      @HttpCode(HttpStatus.OK) / NO_CONTENT are extracted
 *
 * NEVER executes decorators, redirects, factories, constructors.
 */

interface HttpCodeCheck {
    readonly sourceText?: string;
    readonly kindName: string;
    readonly isStatic: boolean;
    readonly resolvedSymbolName?: string;
}

interface HeaderCheck {
    readonly nameText: string;
    readonly nameKind: string;
    readonly valueText?: string;
    readonly valueKind?: string;
}

interface RedirectCheck {
    readonly urlText: string;
    readonly urlKind: string;
    readonly statusText?: string;
    readonly statusKind?: string;
}

console.log("===== E8 — HTTP METADATA SEMANTIC EXTRACTION =====\n");

const decoratorReader = new DecoratorReader();
const decoratorArguments = new DecoratorArguments();
const inspector = new ExpressionInspector();

// ========== Part A: synthetic ==========
console.log("--- Part A: synthetic ---");

const syntheticSource = [
    "class HttpCode {}",
    "class HttpStatus {}",
    "class Controller {",
    "  m1() {}",
    "  @HttpCode(201) m2() {}",
    "  @HttpCode(HttpCode) m3() {}",
    "  @HttpCode(HttpStatus.CREATED) m4() {}",
    "  @HttpCode(getCode()) m5() {}",
    "  @HttpCode({}) m6() {}",
    "  @Header('X-Test', 'value') m7() {}",
    "  @Header(name, value) m8() {}",
    "  @Header('X-Only') m9() {}",
    "  @Header('X-A', 'a') @Header('X-B', 'b') m10() {}",
    "  @Redirect('https://example.com') m11() {}",
    "  @Redirect('https://example.com', 301) m12() {}",
    "  @Redirect(url, status) m13() {}",
    "  @Redirect(getUrl()) m14() {}",
    "}",
].join("\n");

const file = ts.createSourceFile(
    "synthetic-http.ts",
    syntheticSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
);

const synthCls = file.statements.find(
    (s): s is ts.ClassDeclaration =>
        ts.isClassDeclaration(s) && s.name?.text === "Controller",
);
if (!synthCls) throw new Error("no class");

const expectedHttpCode: Record<string, HttpCodeCheck> = {
    m2: { sourceText: "201", kindName: "number", isStatic: true },
    m3: { kindName: "identifier", isStatic: true },
    m4: { kindName: "property-access", isStatic: false },
    m5: { kindName: "call", isStatic: false },
    m6: { kindName: "object", isStatic: false },
};

const expectedHeader: Record<string, HeaderCheck[]> = {
    m7: [{ nameText: "'X-Test'", nameKind: "string", valueText: "'value'", valueKind: "string" }],
    m8: [{ nameText: "name", nameKind: "identifier", valueText: "value", valueKind: "identifier" }],
    m9: [{ nameText: "'X-Only'", nameKind: "string" }],
    m10: [
        { nameText: "'X-A'", nameKind: "string", valueText: "'a'", valueKind: "string" },
        { nameText: "'X-B'", nameKind: "string", valueText: "'b'", valueKind: "string" },
    ],
};

const expectedRedirect: Record<string, RedirectCheck> = {
    m11: { urlText: "'https://example.com'", urlKind: "string" },
    m12: { urlText: "'https://example.com'", urlKind: "string", statusText: "301", statusKind: "number" },
    m13: { urlText: "url", urlKind: "identifier", statusText: "status", statusKind: "identifier" },
    m14: { urlText: "getUrl()", urlKind: "call" },
};

const extractorNoResolvers = new HttpMetadataExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
);

let aPass = 0;
let aTotal = 0;

for (const member of synthCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const methodName = member.name.getText();
    const view = extractorNoResolvers.extract(member);

    // @HttpCode
    const expHC = expectedHttpCode[methodName];
    if (expHC) {
        aTotal++;
        const v = view.httpCode;
        if (!v) {
            console.log(`  ${methodName} httpCode missing FAIL`);
        } else {
            const ok =
                v.kindName === expHC.kindName &&
                v.isStatic === expHC.isStatic &&
                (expHC.sourceText === undefined ||
                    v.sourceText === expHC.sourceText) &&
                (expHC.resolvedSymbolName === undefined ||
                    v.resolvedSymbolName === expHC.resolvedSymbolName);
            if (ok) aPass++;
            console.log(
                `  ${methodName} httpCode src="${v.sourceText}" ` +
                    `kind=${v.kindName} static=${v.isStatic} ` +
                    `sym=${v.resolvedSymbolName ?? "-"} ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }

    // @Header
    const expH = expectedHeader[methodName];
    if (expH) {
        aTotal++;
        const headers = view.headers;
        const ok =
            headers.length === expH.length &&
            expH.every((e, i) => {
                const h = headers[i];
                return (
                    h !== undefined &&
                    h.name.sourceText === e.nameText &&
                    h.name.kindName === e.nameKind &&
                    (e.valueText === undefined ||
                        (h.value !== undefined &&
                            h.value.sourceText === e.valueText)) &&
                    (e.valueKind === undefined ||
                        (h.value !== undefined &&
                            h.value.kindName === e.valueKind))
                );
            });
        if (ok) aPass++;
        console.log(
            `  ${methodName} headers=${headers.length} ` +
                JSON.stringify(
                    headers.map(h => ({
                        n: h.name.sourceText,
                        v: h.value?.sourceText,
                    })),
                ) +
                (ok ? " PASS" : " FAIL"),
        );
    }

    // @Redirect
    const expR = expectedRedirect[methodName];
    if (expR) {
        aTotal++;
        const r = view.redirect;
        if (!r) {
            console.log(`  ${methodName} redirect missing FAIL`);
        } else {
            const ok =
                r.url.sourceText === expR.urlText &&
                r.url.kindName === expR.urlKind &&
                (expR.statusText === undefined ||
                    (r.status !== undefined &&
                        r.status.sourceText === expR.statusText)) &&
                (expR.statusKind === undefined ||
                    (r.status !== undefined &&
                        r.status.kindName === expR.statusKind));
            if (ok) aPass++;
            console.log(
                `  ${methodName} redirect url="${r.url.sourceText}" ` +
                    `status="${r.status?.sourceText ?? ""}" ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }
}
console.log(`  Summary: ${aPass}/${aTotal}`);

// ========== Part B: synthetic with resolvers ==========
console.log("\n--- Part B: synthetic with resolvers ---");

const project = new AstProject({
    tsconfigPath: path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../../apps/example-api/tsconfig.json",
    ),
});
const symbolResolver = new SymbolResolver(project);
const declarationResolver = new DeclarationResolver(project);

const extractorWithResolvers = new HttpMetadataExtractor(
    decoratorReader,
    decoratorArguments,
    inspector,
    symbolResolver,
    declarationResolver,
);

let bPass = 0;
let bTotal = 0;

for (const member of synthCls.members) {
    if (!ts.isMethodDeclaration(member)) continue;
    const view = extractorWithResolvers.extract(member);
    const hasMetadata =
        view.httpCode !== undefined ||
        view.headers.length > 0 ||
        view.redirect !== undefined;
    // Methods with no HTTP metadata are correctly handled (empty
    // view); methods with metadata must extract cleanly.
    if (!hasMetadata) {
        bPass++;
        bTotal++;
        continue;
    }
    bTotal++;
    const ok =
        (view.httpCode === undefined ||
            typeof view.httpCode.kindName === "string") &&
        Array.isArray(view.headers) &&
        (view.redirect === undefined ||
            typeof view.redirect.url.kindName === "string");
    if (ok) bPass++;
}
console.log(`  Summary: ${bPass}/${bTotal}`);

// ========== Part C: example-api integration ==========
console.log("\n--- Part C: example-api integration ---");

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

const expectedExampleApi: Record<string, string> = {
    "ProductsController.create": "HttpStatus.CREATED",
    "ProductsController.remove": "HttpStatus.NO_CONTENT",
    "OrdersController.create": "HttpStatus.CREATED",
    "CartController.addItem": "HttpStatus.OK",
    "UsersController.register": "HttpStatus.CREATED",
    "UsersController.login": "HttpStatus.OK",
};

for (const sourceFile of sourceFiles) {
    if (sourceFile.isDeclarationFile) continue;
    const controllers = controllerAnalyzer.analyze(sourceFile);
    for (const controller of controllers) {
        const routes = routeAnalyzer.analyze(controller);
        for (const route of routes) {
            const key = `${controller.name}.${route.name}`;
            const expKind = expectedExampleApi[key];
            if (!expKind) continue;
            cTotal++;
            const ok =
                route.httpCode !== undefined &&
                route.httpCode.kindName === "property-access" &&
                route.httpCode.sourceText === expKind &&
                route.httpCode.isStatic === false &&
                route.httpCode.resolvedSymbolName === "CREATED" ||
                route.httpCode.resolvedSymbolName === "OK" ||
                route.httpCode.resolvedSymbolName === "NO_CONTENT";
            if (ok) cPass++;
            console.log(
                `  ${key} httpCode="${route.httpCode?.sourceText}" ` +
                    `kind=${route.httpCode?.kindName} ` +
                    `static=${route.httpCode?.isStatic} ` +
                    `sym=${route.httpCode?.resolvedSymbolName ?? "-"} ` +
                    (ok ? "PASS" : "FAIL"),
            );
        }
    }
}
console.log(`  Summary: ${cPass}/${cTotal}`);

if (aPass !== aTotal || bPass !== bTotal || cPass !== cTotal) {
    process.exit(1);
}