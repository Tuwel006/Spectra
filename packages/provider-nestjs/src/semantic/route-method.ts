import { HttpMethod } from "@spectra/core";
import ts from "typescript";

import { DecoratorReader } from "../utils";

import { RoutePathExtractor } from "./route-path";

/**
 * Single HTTP-verb decorator recognition entry.
 *
 * Maps decorator source names (e.g. "Get", "Post") to their
 * normalized HttpMethod enum values.
 */
export interface HttpVerbEntry {
    readonly decoratorName: string;
    readonly httpMethod: HttpMethod;
}

export const HTTP_VERBS: readonly HttpVerbEntry[] = [
    { decoratorName: "Get", httpMethod: HttpMethod.GET },
    { decoratorName: "Post", httpMethod: HttpMethod.POST },
    { decoratorName: "Put", httpMethod: HttpMethod.PUT },
    { decoratorName: "Patch", httpMethod: HttpMethod.PATCH },
    { decoratorName: "Delete", httpMethod: HttpMethod.DELETE },
    { decoratorName: "Options", httpMethod: HttpMethod.OPTIONS },
    { decoratorName: "Head", httpMethod: HttpMethod.HEAD },
    { decoratorName: "All", httpMethod: HttpMethod.ALL },
];

export interface RouteDecoratorView {
    readonly decoratorName: string;
    readonly decoratorIndex: number;
    readonly httpMethod: HttpMethod;
    readonly sourcePath: string | undefined;
    readonly expressionKind: string;
    readonly value: string | undefined;
    readonly normalizedPath: string;
    readonly isStatic: boolean;
}

/**
 * Identifies all HTTP-verb decorators on a method (preserving
 * source order and decorator index) and combines each one with
 * the corresponding route path view.
 *
 * Multiple HTTP decorators on the same method produce multiple
 * RouteDecoratorView entries — they are NEVER merged.
 */
export class RouteMethodExtractor {
    private readonly decoratorReader: DecoratorReader;
    private readonly pathExtractor: RoutePathExtractor;

    public constructor(
        decoratorReader: DecoratorReader,
        pathExtractor: RoutePathExtractor,
    ) {
        this.decoratorReader = decoratorReader;
        this.pathExtractor = pathExtractor;
    }

    public extract(
        methodNode: ts.MethodDeclaration,
    ): readonly RouteDecoratorView[] {
        const decorators = this.decoratorReader.getDecorators(methodNode);
        const views: RouteDecoratorView[] = [];
        for (let i = 0; i < decorators.length; i++) {
            const decorator = decorators[i];
            const verb = this.matchVerb(decorator);
            if (!verb) continue;
            const pathView = this.pathExtractor.extract(decorator);
            views.push({
                decoratorName: verb.decoratorName,
                decoratorIndex: i,
                httpMethod: verb.httpMethod,
                sourcePath: pathView.sourceText,
                expressionKind: pathView.expressionKind,
                value: pathView.value,
                normalizedPath: pathView.normalized,
                isStatic: pathView.isStatic,
            });
        }
        return views;
    }

    private matchVerb(decorator: ts.Decorator): HttpVerbEntry | undefined {
        const name = this.decoratorReader.getName(decorator);
        if (!name) return undefined;
        return HTTP_VERBS.find(v => v.decoratorName === name);
    }
}