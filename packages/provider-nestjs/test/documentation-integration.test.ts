import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
    decodeDocumentation,
    resolveSpectraBinPath,
    type Documentation,
} from "@spectra/core";

import { DocumentationBuilder, SpectraBuildPipeline } from "../src";

/**
 * End-to-end Documentation integration test.
 *
 * Runs the full pipeline against `apps/example-api`:
 *
 *   1. Take a project root directory (argv[2], default
 *      `apps/example-api`).
 *   2. `DocumentationBuilder` (provider-nestjs) inspects the project
 *      source and produces a `Documentation` value object.
 *   3. `SpectraBuildPipeline` orchestrates encode + write — runs
 *      the builder, encodes via the `MsgpackGzipEncoder`, and writes
 *      via the `FileSystemSpectraWriter`.
 *   4. `decodeDocumentation` reads the on-disk `.spectra/document.bin`
 *      and validates that the round-trip preserves every field the
 *      assertions below check.
 *
 * No application code is ever executed. The script prints the
 * resulting object and verifies its invariants.
 */

async function main(): Promise<void> {
    console.log("===== DOCUMENTATION — END-TO-END INTEGRATION =====\n");

    const here = path.dirname(fileURLToPath(import.meta.url));
    const defaultRoot = path.resolve(
        here,
        "..",
        "..",
        "..",
        "apps",
        "example-api",
    );
    const projectRoot = path.resolve(process.argv[2] ?? defaultRoot);

    console.log(`Project root: ${projectRoot}`);

    let pass = 0;
    let total = 0;
    const check = (name: string, ok: boolean): void => {
        total++;
        if (ok) pass++;
        console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}`);
    };

    let documentation: Documentation;
    let binPath: string;
    let binBytes: number;
    try {
        // Stage 1 — Builder only (in-memory, no I/O beyond source reads).
        // Kept in the test so we can inspect the raw Documentation
        // object before encoding.
        documentation = new DocumentationBuilder(projectRoot).build();
    } catch (err) {
        console.error(
            `\nFATAL: DocumentationBuilder.build() threw: ${(err as Error).message}`,
        );
        process.exit(1);
    }

    try {
        // Stage 2 — Full pipeline (build → encode → write). This is
        // what production code does. The result lives at
        // `<projectRoot>/.spectra/document.bin`.
        const result = await new SpectraBuildPipeline(projectRoot).run();
        binPath = result.destination;
        binBytes = result.bytesWritten;
        console.log(`\nWrote ${binBytes} bytes to ${binPath}`);
    } catch (err) {
        console.error(
            `\nFATAL: SpectraBuildPipeline.run() threw: ${(err as Error).message}`,
        );
        process.exit(1);
    }

    console.log("\n--- documentation structure ---");
    console.log(JSON.stringify(documentation, null, 2));

    console.log("\n--- assertions ---");

    // === Stage 0 — On-disk artefacts ===
    const expectedBinPath = resolveSpectraBinPath(projectRoot);
    check("bin path is projectRoot/.spectra/document.bin", binPath === expectedBinPath);
    check(
        "bin file exists on disk",
        await fs
            .stat(binPath)
            .then((s) => s.isFile())
            .catch(() => false),
    );
    check(
        "bin bytes look opaque (no readable JSON markers)",
        !(await fs.readFile(binPath, "utf-8").then((s) => s.startsWith("{"))),
    );
    check(
        "bin is larger than the 8-byte header",
        binBytes > 8,
    );

    // === Stage 0b — Decode round-trip ===
    let decoded: Documentation;
    try {
        decoded = await decodeDocumentation(
            new Uint8Array(await fs.readFile(binPath)),
        );
        check("decodeDocumentation round-trip succeeds", true);
    } catch (err) {
        decoded = documentation;
        check(
            `decodeDocumentation threw: ${(err as Error).message}`,
            false,
        );
    }
    check(
        "decoded info.title matches in-memory",
        decoded.info.title === documentation.info.title,
    );
    check(
        "decoded info.version matches in-memory",
        decoded.info.version === documentation.info.version,
    );
    check(
        "decoded paths count matches in-memory",
        Object.keys(decoded.paths).length ===
            Object.keys(documentation.paths).length,
    );
    check(
        "decoded servers count matches in-memory",
        decoded.servers.length === documentation.servers.length,
    );

    // === Stage 1 — Info ===
    check(
        "documentation.id === 'documentation'",
        documentation.id === "documentation",
    );
    check(
        "info.title === '@spectra/example-api'",
        documentation.info.title === "@spectra/example-api",
    );
    check("info.version === '0.0.1'", documentation.info.version === "0.0.1");
    check(
        "info.summary is string or undefined",
        documentation.info.summary === undefined ||
            typeof documentation.info.summary === "string",
    );

    // === Stage 2 — Servers ===
    check("servers is an array", Array.isArray(documentation.servers));
    check(
        "servers emit at least one entry from bootstrap port (3000)",
        documentation.servers.some(s => s.url === "http://localhost:3000"),
    );
    check(
        "servers have unique ids",
        new Set(documentation.servers.map(s => s.id)).size ===
            documentation.servers.length,
    );

    // === Stage 3 — Tags ===
    check("tags is an array", Array.isArray(documentation.tags));
    check(
        "tags contains the expected NestJS controller prefixes",
        ["Products", "Users", "Cart", "Orders", "Auth"].every(prefix =>
            documentation.tags.some(t => t.name === prefix),
        ),
    );
    check(
        "tags have unique ids",
        new Set(documentation.tags.map(t => t.id)).size ===
            documentation.tags.length,
    );

    // === Stage 4 — Components (schemas) ===
    check(
        "components.schemas is populated",
        typeof documentation.components.schemas === "object" &&
            Object.keys(documentation.components.schemas).length > 0,
    );
    const schemaIds = Object.keys(documentation.components.schemas);
    check(
        "CreateProductDto schema is present",
        schemaIds.includes("CreateProductDto"),
    );
    check(
        "CreateUserDto schema is present",
        schemaIds.includes("CreateUserDto"),
    );
    check(
        "UpdateProductDto schema is present",
        schemaIds.includes("UpdateProductDto"),
    );
    check(
        "LoginDto schema is present",
        schemaIds.includes("LoginDto"),
    );
    check(
        "AddToCartDto schema is present",
        schemaIds.includes("AddToCartDto"),
    );
    check(
        "CreateProductDto has expected properties",
        (() => {
            const schema = documentation.components.schemas["CreateProductDto"];
            if (!schema) return false;
            const propNames = Object.keys(schema.properties).sort();
            return (
                propNames.length === 5 &&
                propNames.includes("name") &&
                propNames.includes("description") &&
                propNames.includes("price") &&
                propNames.includes("stock") &&
                propNames.includes("category")
            );
        })(),
    );
    check(
        "CreateProductDto.name is string primitive",
        (() => {
            const schema = documentation.components.schemas["CreateProductDto"];
            const prop = schema?.properties["name"];
            return (
                prop?.valueType.kind === "primitive" &&
                (prop.valueType as { name?: string }).name === "string"
            );
        })(),
    );
    check(
        "CreateProductDto.price is number primitive",
        (() => {
            const schema = documentation.components.schemas["CreateProductDto"];
            const prop = schema?.properties["price"];
            return (
                prop?.valueType.kind === "primitive" &&
                (prop.valueType as { name?: string }).name === "number"
            );
        })(),
    );

    // === Stage 5 — Paths ===
    check("paths is populated", Object.keys(documentation.paths).length > 0);
    check(
        "/products path exists",
        typeof documentation.paths["/products"] !== "undefined",
    );
    check(
        "/products/:id path exists",
        typeof documentation.paths["/products/:id"] !== "undefined",
    );
    check(
        "/auth/login path exists",
        typeof documentation.paths["/auth/login"] !== "undefined",
    );

    const productsFindOne = documentation.paths["/products/:id"]?.operations.GET;
    check(
        "ProductsController.findOne operation has operationId",
        productsFindOne?.operationId === "ProductsController.findOne#GET",
    );
    check(
        "ProductsController.findOne operation is GET",
        productsFindOne?.method === "GET",
    );
    check(
        "ProductsController.findOne has 1 path parameter (id)",
        productsFindOne?.request.pathParameters.length === 1,
    );
    check(
        "ProductsController.findOne path param name is 'id'",
        productsFindOne?.request.pathParameters[0]?.name === "id",
    );
    check(
        "ProductsController.findOne has 200 response",
        typeof productsFindOne?.responses["200"] !== "undefined",
    );
    check(
        "ProductsController.findOne 200 response body is a Schema reference",
        (() => {
            const body = productsFindOne?.responses["200"]?.body?.content[
                "application/json"
            ];
            return body?.schema !== undefined;
        })(),
    );

    const productsCreate = documentation.paths["/products"]?.operations.POST;
    check(
        "ProductsController.create operation is POST",
        productsCreate?.method === "POST",
    );
    check(
        "ProductsController.create has CreateProductDto body schema",
        (() => {
            const body = productsCreate?.request.body?.content["application/json"];
            return body?.schema?.id === "CreateProductDto";
        })(),
    );
    check(
        "ProductsController.create returns 201 (from @HttpCode(HttpStatus.CREATED))",
        typeof productsCreate?.responses["201"] !== "undefined",
    );

    const productsList = documentation.paths["/products"]?.operations.GET;
    check(
        "ProductsController.findAll has category query param",
        (() => {
            const params = productsList?.request.queryParameters;
            return params?.some(p => p.name === "category") === true;
        })(),
    );

    const usersLogin = documentation.paths["/users/login"]?.operations.POST;
    check(
        "UsersController.login exists as POST",
        usersLogin !== undefined,
    );
    check(
        "UsersController.login has LoginDto body schema",
        (() => {
            const body = usersLogin?.request.body?.content["application/json"];
            return body?.schema?.id === "LoginDto";
        })(),
    );
    check(
        "UsersController.login returns 200 (from @HttpCode(HttpStatus.OK))",
        typeof usersLogin?.responses["200"] !== "undefined",
    );

    const usersRegister = documentation.paths["/users/register/test"]?.operations.POST;
    check(
        "UsersController.register exists as POST",
        usersRegister !== undefined,
    );
    check(
        "UsersController.register returns 201 (from @HttpCode(HttpStatus.CREATED))",
        typeof usersRegister?.responses["201"] !== "undefined",
    );
    check(
        "UsersController.register has CreateUserDto body schema",
        (() => {
            const body = usersRegister?.request.body?.content["application/json"];
            return body?.schema?.id === "CreateUserDto";
        })(),
    );

    const usersProfile = documentation.paths["/users/profile/:id"]?.operations.GET;
    check(
        "UsersController.getProfile exists as GET",
        usersProfile !== undefined,
    );
    check(
        "UsersController.getProfile has :id path parameter",
        usersProfile?.request.pathParameters[0]?.name === "id",
    );
    check(
        "UsersController.getProfile has JwtAuthGuard as custom guard",
        (() => {
            const guards = usersProfile?.guards;
            return (
                guards?.length === 1 &&
                guards[0].name === "JwtAuthGuard" &&
                guards[0].kind === "custom"
            );
        })(),
    );

    // === Guard coverage ===
    const ordersGet = documentation.paths["/orders"]?.operations.GET;
    check(
        "OrdersController.findAll inherits class-level JwtAuthGuard",
        (() => {
            const guards = ordersGet?.guards;
            return (
                guards?.length === 1 &&
                guards[0].name === "JwtAuthGuard" &&
                guards[0].kind === "custom"
            );
        })(),
    );

    const cartGet = documentation.paths["/cart"]?.operations.GET;
    check(
        "CartController inherits class-level JwtAuthGuard",
        (() => {
            const guards = cartGet?.guards;
            return (
                guards?.length === 1 &&
                guards[0].name === "JwtAuthGuard" &&
                guards[0].kind === "custom"
            );
        })(),
    );

    const authMe = documentation.paths["/auth/me"]?.operations.GET;
    check(
        "AuthController.me has method-level JwtAuthGuard",
        (() => {
            const guards = authMe?.guards;
            return (
                guards?.length === 1 &&
                guards[0].name === "JwtAuthGuard" &&
                guards[0].kind === "custom"
            );
        })(),
    );

    // === Verify all operations that DON'T have guards ===
    const productsFindOneGuards = documentation.paths["/products/:id"]?.operations.GET;
    check(
        "ProductsController.findOne has no guards (no @UseGuards anywhere)",
        productsFindOneGuards?.guards === undefined ||
            productsFindOneGuards.guards.length === 0,
    );

    // === Cross-cutting invariants ===
    check(
        "every path has an id",
        Object.values(documentation.paths).every(p => typeof p.id === "string"),
    );
    check(
        "every operation has a unique id",
        (() => {
            const allOpIds = new Set<string>();
            for (const p of Object.values(documentation.paths)) {
                for (const op of Object.values(p.operations)) {
                    if (!op) continue;
                    if (allOpIds.has(op.id)) return false;
                    allOpIds.add(op.id);
                }
            }
            return true;
        })(),
    );

    console.log(`\nSummary: ${pass}/${total}`);
    if (pass !== total) process.exit(1);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
