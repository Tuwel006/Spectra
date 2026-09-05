import ts from "typescript";
import {
    DeclarationResolver,
    ExpressionInspector,
    SymbolResolver,
} from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";
import { DecoratorArgExtractor, DecoratorArgView } from "./decorator-arg";

/**
 * Per-route HTTP metadata extracted from `@HttpCode(...)`,
 * `@Header(name, value?)`, `@Redirect(url, status?)` (E8).
 *
 * All view types are explicit and correctly named. The underlying
 * shape is the shared `DecoratorArgView` (preserves source text,
 * expression kind, symbol / declaration info, isStatic,
 * children — same shape as Guards / Pipes / Interceptors / Filters
 * from E6/E7). The semantic MODEL distinguishes between
 * `httpCode`, `headers`, and `redirect` at the metadata level.
 */

/** Single-argument @HttpCode view (status code). */
export type HttpCodeArgView = DecoratorArgView;

/** @Header decorator entry: name + (optional) value. */
export interface HeaderArgView {
    readonly name: DecoratorArgView;
    readonly value: DecoratorArgView | undefined;
}

/** @Redirect decorator entry: url + (optional) status code. */
export interface RedirectArgView {
    readonly url: DecoratorArgView;
    readonly status: DecoratorArgView | undefined;
}

/**
 * Combined HTTP metadata view produced for a single method.
 *
 * Each field is `undefined` (or empty array) when the corresponding
 * decorator is absent.
 */
export interface HttpMetadataView {
    readonly httpCode: HttpCodeArgView | undefined;
    readonly headers: readonly HeaderArgView[];
    readonly redirect: RedirectArgView | undefined;
}

/**
 * Extracts per-method HTTP metadata.
 *
 * Reuses the existing `DecoratorArgExtractor` (E6/E7 generic
 * primitive) — no new resolver classes. Never executes any
 * application code or decorator callback.
 */
export class HttpMetadataExtractor {
    private readonly httpCodeExtractor: DecoratorArgExtractor;
    private readonly headerExtractor: DecoratorArgExtractor;
    private readonly redirectExtractor: DecoratorArgExtractor;

    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        symbolResolver?: SymbolResolver,
        declarationResolver?: DeclarationResolver,
    ) {
        this.httpCodeExtractor = new DecoratorArgExtractor(
            "HttpCode",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
        this.headerExtractor = new DecoratorArgExtractor(
            "Header",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
        this.redirectExtractor = new DecoratorArgExtractor(
            "Redirect",
            decoratorReader,
            decoratorArguments,
            inspector,
            symbolResolver,
            declarationResolver,
        );
    }

    public extract(
        methodNode: ts.MethodDeclaration,
    ): HttpMetadataView {
        return {
            httpCode: this.firstArg(this.httpCodeExtractor, methodNode),
            headers: this.extractHeaders(methodNode),
            redirect: this.extractRedirect(methodNode),
        };
    }

    private firstArg(
        extractor: DecoratorArgExtractor,
        node: ts.MethodDeclaration,
    ): DecoratorArgView | undefined {
        const args = extractor.extract(node);
        return args[0];
    }

    private extractHeaders(
        node: ts.MethodDeclaration,
    ): readonly HeaderArgView[] {
        // The DecoratorArgExtractor combines all @Header decorators
        // via findAll. Each call has 1 or 2 arguments (name required,
        // value optional). We pair them up: arg0=name, arg1=value.
        const all = this.headerExtractor.extract(node);
        const out: HeaderArgView[] = [];
        for (let i = 0; i < all.length; i += 2) {
            const name = all[i];
            const value = all[i + 1];
            out.push({ name, value });
        }
        return out;
    }

    private extractRedirect(
        node: ts.MethodDeclaration,
    ): RedirectArgView | undefined {
        // Redirect takes 1 or 2 arguments (url required, status optional).
        const all = this.redirectExtractor.extract(node);
        if (all.length === 0) return undefined;
        const url = all[0];
        const status = all[1];
        return { url, status };
    }
}