import ts from "typescript";
import { ExpressionInspector } from "@spectra/provider-ast";

import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Structural view of the `@Controller(...)` decorator argument.
 *
 * E1 produces this view per controller class. The view preserves
 * the raw source text and the ExpressionInspector classification
 * alongside the (where-applicable) string-literal value and a
 * normalized path. E3 (route composition) will combine
 * `normalizedPath` with route paths; this E1 step only normalizes
 * the controller's own path component (no leading/trailing slashes,
 * no duplicate slashes).
 */
export interface ControllerPathView {
    /** Raw source text of the argument expression, or undefined. */
    readonly sourceText: string | undefined;
    /** ExpressionInspector classification of the argument expression. */
    readonly expressionKind: string;
    /** String-literal value when applicable; otherwise undefined. */
    readonly value: string | undefined;
    /** Normalized controller path component (empty string when absent). */
    readonly normalized: string;
}

/**
 * Extracts the controller path from `@Controller(...)` decorators.
 *
 * The extractor never evaluates the argument; non-string-literal
 * arguments preserve their AST source text and expression kind for
 * later semantic consumers.
 */
export class ControllerPathExtractor {
    private readonly decoratorReader: DecoratorReader;
    private readonly decoratorArguments: DecoratorArguments;
    private readonly inspector: ExpressionInspector;

    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
    ) {
        this.decoratorReader = decoratorReader;
        this.decoratorArguments = decoratorArguments;
        this.inspector = inspector;
    }

    public extract(classNode: ts.ClassDeclaration): ControllerPathView {
        const decorator = this.decoratorReader.find(
            classNode,
            "Controller",
        );
        if (!decorator) {
            return {
                sourceText: undefined,
                expressionKind: "<no-decorator>",
                value: undefined,
                normalized: "",
            };
        }
        const args = this.decoratorArguments.get(decorator);
        if (args.length === 0) {
            return {
                sourceText: undefined,
                expressionKind: "<zero-args>",
                value: undefined,
                normalized: "",
            };
        }
        const arg = args[0];
        const inspected = this.inspector.inspect(arg);
        const value = ts.isStringLiteral(arg) ? arg.text : undefined;
        return {
            sourceText: arg.getText(),
            expressionKind: inspected.kind,
            value,
            normalized: normalize(value ?? ""),
        };
    }
}

function normalize(path: string): string {
    return path
        .split("/")
        .filter(segment => segment.length > 0)
        .join("/");
}