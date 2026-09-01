import ts from "typescript";
import {
    ContentType,
    DecoratorUsage,
    Header,
    HttpMethod,
    MediaType,
    NamedCollection,
    Operation,
    Parameter,
    ParameterLocation,
    Path,
    Request,
    RequestBody,
    Response,
    ResponseBody,
} from "@spectra/core";

import type { RouteOperation } from "../semantic/unified-model";
import type { DecoratorArgView } from "../semantic/decorator-arg";

/**
 * Converts the unified semantic model produced by E10 into the
 * `Documentation.paths` portion of the documentation model.
 *
 * Inputs:
 *   - {@list} `RouteOperation[]` (already flat from E10)
 *   - {@link Operation.parameters} (E4) — `@Param` / `@Query` /
 *     `@Body` parameter decorators
 *   - {@link Operation.httpCode} (E8) — `@HttpCode` decorator
 *   - `RouteOperation.methodNode` — original `ts.MethodDeclaration`
 *     for return-type introspection
 *
 * Outputs:
 *   - `NamedCollection<Path>` keyed by composed path. Each Path
 *     carries a `Partial<Record<HttpMethod, Operation>>` so multiple
 *     HTTP verbs can share the same URL.
 *
 * Layering rules:
 *   - This file lives in `provider-nestjs` because parameter
 *     classification (`@Param` → path, `@Query` → query, `@Body` →
 *     body) is NestJS-specific decorator semantics. A Fastify
 *     generator would be a sibling.
 *   - It does NOT instantiate any class / DTO / controller. It reads
 *     the TypeScript AST only.
 *   - It does NOT invent descriptions, summaries, or example values.
 *
 * Conversion rules:
 *   - `@Param("key")`       → path parameter keyed by `key`
 *                              (or by parameter name when key absent)
 *   - `@Query("key")`       → query parameter keyed by `key`
 *   - `@Headers("key")`     → request header keyed by `key`
 *   - `@Body("key")`        → request body body (always JSON content
 *                              type for now). The body schema is
 *                              resolved from the parameter's class
 *                              type when available.
 *   - Return type (when not `void`) → response body for the
 *     declared status code (or 200 default; 201 for POST).
 *   - `HttpStatus.OK` / `HttpStatus.CREATED` / etc. → response key
 *     is the integer status code as a string.
 */
export class PathGenerator {
    public generate(
        operations: readonly RouteOperation[],
    ): NamedCollection<Path> {
        const byPath = new Map<string, Map<HttpMethod, Operation>>();

        for (const op of operations) {
            const composedPath = this.normalizedPath(op.composedPath);
            let methodMap = byPath.get(composedPath);
            if (methodMap === undefined) {
                methodMap = new Map();
                byPath.set(composedPath, methodMap);
            }
            methodMap.set(op.httpMethod, this.buildOperation(op));
        }

        const out: Record<string, Path> = {};
        for (const [pathUrl, methodMap] of byPath) {
            const operationsRecord: Partial<Record<HttpMethod, Operation>> =
                {};
            for (const [method, operation] of methodMap) {
                operationsRecord[method] = operation;
            }
            out[pathUrl] = {
                id: pathUrl,
                url: pathUrl,
                operations: operationsRecord,
            };
        }
        return out;
    }

    /**
     * Normalize a composed path to the canonical URL form used as the
     * Path id (and key in the NamedCollection). Ensures a leading
     * slash and no trailing slash.
     */
    private normalizedPath(composedPath: string): string {
        if (composedPath === "" || composedPath === "/") return "/";
        const withLeading = composedPath.startsWith("/")
            ? composedPath
            : `/${composedPath}`;
        return withLeading.replace(/\/+$/, "");
    }

    private buildOperation(op: RouteOperation): Operation {
        return {
            id: `${op.composedPath}#${op.httpMethod}`,
            operationId: op.identityKey,
            method: op.httpMethod,
            request: this.buildRequest(op),
            responses: this.buildResponses(op),
            guards: this.mergeDecoratorUsage(
                op.classGuards,
                op.guards,
            ),
            pipes: this.mergeDecoratorUsage(
                op.classPipes,
                op.pipes,
            ),
            interceptors: this.mergeDecoratorUsage(
                op.classInterceptors,
                op.interceptors,
            ),
            filters: this.mergeDecoratorUsage(
                op.classFilters,
                op.filters,
            ),
        };
    }

    /**
     * Combine class-scope and method-scope decorator arguments into
     * one deduplicated, source-ordered list of {@link DecoratorUsage}
     * entries.
     *
     * Classification:
     *   - `identifier`   → `"custom"` (bare class reference).
     *   - `call`         → `"built-in"` (factory invocation
     *                      pattern, e.g. `AuthGuard('jwt')`).
     *   - `array`        → `"custom"` (array of class refs).
     *   - `object`       → `"unknown"` (provider config object).
     *   - anything else  → `"unknown"`.
     *
     * The `parameters` field of a `DecoratorUsage` carries the textual
     * arguments of a call expression so the documentation can render
     * exactly what the developer wrote (e.g. `["'jwt'"]`).
     *
     * Duplicates are removed by comparing the `sourceText` (two
     * `@UseGuards(JwtAuthGuard)` entries collapse to one). The
     * class-level entries come first so source order is preserved.
     */
    private mergeDecoratorUsage(
        classScope: readonly DecoratorArgView[],
        methodScope: readonly DecoratorArgView[],
    ): readonly DecoratorUsage[] | undefined {
        if (classScope.length === 0 && methodScope.length === 0) {
            return undefined;
        }
        const seen = new Set<string>();
        const out: DecoratorUsage[] = [];
        let counter = 0;

        const consume = (entry: DecoratorArgView): void => {
            const usage = this.toDecoratorUsage(entry, counter++);
            if (seen.has(usage.sourceText)) return;
            seen.add(usage.sourceText);
            out.push(usage);
        };

        for (const entry of classScope) consume(entry);
        for (const entry of methodScope) consume(entry);
        return out;
    }

    private toDecoratorUsage(
        view: DecoratorArgView,
        counter: number,
    ): DecoratorUsage {
        const sourceText = view.sourceText ?? "";
        const kind = this.classifyKind(view);
        const parameters = this.collectParameters(view);
        return {
            id: `decorator-${counter}-${this.slug(sourceText)}`,
            name: this.usageName(view),
            kind,
            sourceText,
            parameters,
        };
    }

    private classifyKind(
        view: DecoratorArgView,
    ): DecoratorUsage["kind"] {
        switch (view.kindName) {
            case "identifier":
                return "custom";
            case "call":
                return "built-in";
            case "array":
                return "custom";
            case "object":
                return "unknown";
            default:
                return "unknown";
        }
    }

    private usageName(view: DecoratorArgView): string {
        if (view.className) return view.className;
        if (view.resolvedSymbolName) return view.resolvedSymbolName;
        return view.sourceText ?? "<unknown>";
    }

    private collectParameters(
        view: DecoratorArgView,
    ): readonly string[] {
        if (view.kindName === "call") {
            return view.children.map(c => c.sourceText ?? "");
        }
        if (view.kindName === "identifier" && view.children.length > 0) {
            return view.children.map(c => c.sourceText ?? "");
        }
        return [];
    }

    private slug(text: string): string {
        return text.replace(/[^A-Za-z0-9]/g, "_");
    }

    private buildRequest(op: RouteOperation): Request {
        const pathParameters: Parameter[] = [];
        const queryParameters: Parameter[] = [];
        const requestHeaders: Header[] = [];
        let body: RequestBody | undefined;

        for (const p of op.parameters) {
            const schemaId = this.classSchemaId(p.type.sourceText);
            switch (p.decoratorName) {
                case "Param": {
                    pathParameters.push({
                        id: `${op.identityKey}.param.${p.name}`,
                        name: p.key ?? p.name,
                        location: ParameterLocation.PATH,
                        required: !p.type.sourceText.includes("?"),
                        schemaId,
                    });
                    break;
                }
                case "Query": {
                    queryParameters.push({
                        id: `${op.identityKey}.query.${p.name}`,
                        name: p.key ?? p.name,
                        location: ParameterLocation.QUERY,
                        required: !p.type.sourceText.includes("?"),
                        schemaId,
                    });
                    break;
                }
                case "Headers": {
                    requestHeaders.push({
                        id: `${op.identityKey}.header.${p.name}`,
                        name: p.key ?? p.name,
                        required: !p.type.sourceText.includes("?"),
                        schemaId,
                    });
                    break;
                }
                case "Body": {
                    body = this.buildRequestBody(op, p, schemaId);
                    break;
                }
                default: {
                    // Undecorated parameters: classify by type
                    // heuristically. Strings/primitives on a GET-like
                    // path are treated as query parameters; everything
                    // else is omitted from this structural skeleton
                    // (later generators can specialise).
                    if (
                        p.type.isString ||
                        p.type.isNumber ||
                        p.type.isBoolean
                    ) {
                        queryParameters.push({
                            id: `${op.identityKey}.query.${p.name}`,
                            name: p.name,
                            location: ParameterLocation.QUERY,
                            required: !p.type.sourceText.includes("?"),
                            schemaId,
                        });
                    }
                    break;
                }
            }
        }

        return {
            pathParameters,
            queryParameters,
            headers: requestHeaders,
            body,
        };
    }

    private buildRequestBody(
        op: RouteOperation,
        parameter: { name: string; key: string | undefined },
        schemaId: string | undefined,
    ): RequestBody | undefined {
        if (!schemaId) return undefined;
        const mediaType: MediaType = {
            contentType: ContentType.JSON,
            schema: { id: schemaId },
        };
        return {
            required: true,
            content: {
                "application/json": mediaType,
            },
        };
    }

    private buildResponses(op: RouteOperation): NamedCollection<Response> {
        const status = this.responseStatus(op);
        const returnSchemaId = this.returnSchemaId(op);
        const response: Response = {
            description: undefined,
            headers: [],
            body: returnSchemaId
                ? {
                      content: {
                          "application/json": {
                              contentType: ContentType.JSON,
                              schema: { id: returnSchemaId },
                          },
                      },
                  }
                : undefined,
        };
        return {
            [status]: response,
        };
    }

    private responseStatus(op: RouteOperation): string {
        const code = op.httpCode;
        if (!code) {
            return op.httpMethod === HttpMethod.POST ? "201" : "200";
        }
        return this.staticHttpStatus(op) ?? "200";
    }

    /**
     * Extract a numeric status code from a `HttpCodeArgView`. Supports
     * numeric literals directly and the well-known members of the
     * `@nestjs/common` `HttpStatus` enum. We never evaluate the enum;
     * we map symbol names to their canonical integer values.
     */
    private staticHttpStatus(op: RouteOperation): string | undefined {
        const code = op.httpCode;
        if (!code) return undefined;
        if (code.sourceText && /^\d+$/.test(code.sourceText.trim())) {
            return code.sourceText.trim();
        }
        if (code.resolvedSymbolName) {
            const normalized = code.resolvedSymbolName
                .replace(/^HttpStatus\./, "")
                .toUpperCase();
            const mapped = PathGenerator.HTTP_STATUS_BY_NAME[normalized];
            if (mapped !== undefined) return mapped;
        }
        if (code.sourceText) {
            const propertyAccess = code.sourceText.match(
                /^HttpStatus\.([A-Za-z_][A-Za-z0-9_]*)$/,
            );
            if (propertyAccess) {
                const mapped =
                    PathGenerator.HTTP_STATUS_BY_NAME[
                        propertyAccess[1].toUpperCase()
                    ];
                if (mapped !== undefined) return mapped;
            }
        }
        return undefined;
    }

    /**
     * Subset of the `@nestjs/common` `HttpStatus` enum. We deliberately
     * do not pull in `@nestjs/common` here — Spectra never executes
     * application code — so the values are duplicated statically. If
     * NestJS adds new entries, this map is the place to extend.
     */
    private static readonly HTTP_STATUS_BY_NAME: Readonly<
        Record<string, string>
    > = {
        OK: "200",
        CREATED: "201",
        ACCEPTED: "202",
        NON_AUTHORITATIVE_INFORMATION: "203",
        NO_CONTENT: "204",
        RESET_CONTENT: "205",
        PARTIAL_CONTENT: "206",
        AMBIGUOUS: "300",
        MOVED: "301",
        REDIRECT: "302",
        SEE_OTHER: "303",
        NOT_MODIFIED: "304",
        USE_PROXY: "305",
        UNUSED: "306",
        TEMPORARY_REDIRECT: "307",
        PERMANENT_REDIRECT: "308",
        BAD_REQUEST: "400",
        UNAUTHORIZED: "401",
        PAYMENT_REQUIRED: "402",
        FORBIDDEN: "403",
        NOT_FOUND: "404",
        METHOD_NOT_ALLOWED: "405",
        NOT_ACCEPTABLE: "406",
        PROXY_AUTHENTICATION_REQUIRED: "407",
        REQUEST_TIMEOUT: "408",
        CONFLICT: "409",
        GONE: "410",
        LENGTH_REQUIRED: "411",
        PRECONDITION_FAILED: "412",
        PAYLOAD_TOO_LARGE: "413",
        URI_TOO_LONG: "414",
        UNSUPPORTED_MEDIA_TYPE: "415",
        REQUESTED_RANGE_NOT_SATISFIABLE: "416",
        EXPECTATION_FAILED: "417",
        I_AM_A_TEAPOT: "418",
        UNPROCESSABLE_ENTITY: "422",
        TOO_MANY_REQUESTS: "429",
        INTERNAL_SERVER_ERROR: "500",
        NOT_IMPLEMENTED: "501",
        BAD_GATEWAY: "502",
        SERVICE_UNAVAILABLE: "503",
        GATEWAY_TIMEOUT: "504",
        HTTP_VERSION_NOT_SUPPORTED: "505",
    };

    /**
     * Walk the method declaration's return type and extract a class
     * schema id when the type is a class / interface reference. We
     * never instantiate the type. When the type is a generic wrapper
     * (e.g. `Promise<CreateUserDto>`, `CreateUserDto[]`), we resolve
     * the inner class reference.
     */
    private returnSchemaId(op: RouteOperation): string | undefined {
        const node = op.methodNode;
        const returnType = node.type;
        if (!returnType) return undefined;
        const text = returnType.getText().trim();
        if (text === "void" || text === "Promise<void>") return undefined;

        // Promise<X> → X
        let inner: ts.TypeNode = returnType;
        if (
            ts.isTypeReferenceNode(returnType) &&
            ts.isIdentifier(returnType.typeName) &&
            returnType.typeName.text === "Promise" &&
            returnType.typeArguments &&
            returnType.typeArguments.length > 0
        ) {
            inner = returnType.typeArguments[0];
        }

        // X[] → X
        if (ts.isArrayTypeNode(inner)) {
            inner = inner.elementType;
        }

        // Promise<X[]> → unwrap both
        if (
            ts.isTypeReferenceNode(inner) &&
            ts.isIdentifier(inner.typeName) &&
            inner.typeName.text === "Array" &&
            inner.typeArguments &&
            inner.typeArguments.length > 0
        ) {
            inner = inner.typeArguments[0];
        }

        return this.classSchemaId(inner.getText().trim());
    }

    /**
     * Derive a schema id from a class / interface type text. Strips
     * generic type arguments and produces a PascalCase identifier.
     */
    private classSchemaId(sourceText: string): string | undefined {
        if (sourceText.length === 0) return undefined;
        if (
            sourceText === "string" ||
            sourceText === "number" ||
            sourceText === "boolean" ||
            sourceText === "any" ||
            sourceText === "unknown" ||
            sourceText === "void" ||
            sourceText === "Date"
        ) {
            return undefined;
        }
        const cleaned = sourceText.replace(/<.*$/, "").trim();
        if (!/^[A-Z]/.test(cleaned)) return undefined;
        return cleaned.replace(/[^A-Za-z0-9_]/g, "");
    }
}