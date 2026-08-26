import ts from "typescript";
import { ExpressionInspector } from "@spectra/provider-ast";

import { ParameterMetadata } from "../metadata";
import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Per-parameter semantic extractor (E4).
 *
 * Reads a single `ts.ParameterDeclaration` and produces a
 * `ParameterMetadata` view that preserves:
 *   - parameter name (TypeScript identifier text)
 *   - parameter decorator source (e.g. "Param", "Query", "Body") when
 *     present (undefined otherwise)
 *   - key argument: raw source text + ExpressionInspector
 *     classification + string-literal value (when applicable)
 *   - parameter type source text
 *
 * Never evaluates user code. Never coerces a non-string-literal
 * key expression into a guessed string.
 */
export class ParameterSourceExtractor {
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

    public extract(
        parameter: ts.ParameterDeclaration,
        parameterIndex: number,
    ): ParameterMetadata {
        const name = parameter.name.getText();
        const decorators = this.decoratorReader.getDecorators(parameter);
        const hasDecorator = decorators.length > 0;

        // E4 scope: single decorator per parameter is the common
        // NestJS pattern. The first decorator's name + first-arg
        // (key) are recorded.
        let decoratorName: string | undefined;
        let decoratorIndex = -1;
        let keySourceText: string | undefined;
        let keyExpressionKind: string | undefined;
        let key: string | undefined;
        let keyIsStatic = false;

        for (let i = 0; i < decorators.length; i++) {
            const decorator = decorators[i];
            const currentName = this.decoratorReader.getName(decorator);
            if (!currentName) continue;
            decoratorName = currentName;
            decoratorIndex = i;
            const args = this.decoratorArguments.get(decorator);
            if (args.length > 0) {
                const arg = args[0];
                keySourceText = arg.getText();
                keyExpressionKind = this.inspector.inspect(arg).kind;
                if (ts.isStringLiteral(arg)) {
                    key = arg.text;
                    keyIsStatic = true;
                }
            }
            break;
        }

        const typeText = parameter.type?.getText() ?? "";

        return {
            parameterIndex,
            name,
            decoratorName,
            decoratorIndex,
            keySourceText,
            keyExpressionKind,
            key,
            keyIsStatic,
            typeText,
            hasDecorator,
        };
    }
}