import ts from "typescript";
import { ExpressionInspector } from "@spectra/provider-ast";

import { ParameterMetadata } from "../metadata";
import { ParameterTypeExtractor } from "./parameter-type";
import { DecoratorArguments, DecoratorReader } from "../utils";

/**
 * Per-parameter semantic extractor (E4 + E5).
 *
 * E4: reads a `ts.ParameterDeclaration` and produces a
 * `ParameterMetadata` view that preserves name, decorator, key
 * argument, and parameter type source text.
 *
 * E5: also extracts resolved type semantics via the existing
 * provider-ast TypeResolver (no second TypeChecker abstraction).
 *
 * Never evaluates user code. Never coerces a non-string-literal
 * key expression into a guessed string.
 */
export class ParameterSourceExtractor {
    private readonly decoratorReader: DecoratorReader;
    private readonly decoratorArguments: DecoratorArguments;
    private readonly inspector: ExpressionInspector;
    private readonly typeExtractor: ParameterTypeExtractor;

    public constructor(
        decoratorReader: DecoratorReader,
        decoratorArguments: DecoratorArguments,
        inspector: ExpressionInspector,
        typeExtractor: ParameterTypeExtractor,
    ) {
        this.decoratorReader = decoratorReader;
        this.decoratorArguments = decoratorArguments;
        this.inspector = inspector;
        this.typeExtractor = typeExtractor;
    }

    public extract(
        parameter: ts.ParameterDeclaration,
        parameterIndex: number,
    ): ParameterMetadata {
        const name = parameter.name.getText();
        const decorators = this.decoratorReader.getDecorators(parameter);
        const hasDecorator = decorators.length > 0;

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

        const type = this.typeExtractor.extract(parameter.type);
        const typeText = type.sourceText;

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
            type,
            hasDecorator,
        };
    }
}