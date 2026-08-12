import ts from "typescript";

export type ExpressionKind =
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "identifier"
    | "property-access"
    | "call"
    | "object"
    | "array"
    | "arrow-function"
    | "function"
    | "unknown";

export interface ExpressionInfo {
    kind: ExpressionKind;
    node: ts.Expression;
}

export class ExpressionInspector {

    public inspect(
        expression: ts.Expression,
    ): ExpressionInfo {

        if (ts.isStringLiteral(expression)) {
            return {
                kind: "string",
                node: expression,
            };
        }

        if (ts.isNumericLiteral(expression)) {
            return {
                kind: "number",
                node: expression,
            };
        }

        if (
            expression.kind === ts.SyntaxKind.TrueKeyword ||
            expression.kind === ts.SyntaxKind.FalseKeyword
        ) {
            return {
                kind: "boolean",
                node: expression,
            };
        }

        if (
            expression.kind === ts.SyntaxKind.NullKeyword
        ) {
            return {
                kind: "null",
                node: expression,
            };
        }

        if (ts.isIdentifier(expression)) {
            return {
                kind: "identifier",
                node: expression,
            };
        }

        if (ts.isPropertyAccessExpression(expression)) {
            return {
                kind: "property-access",
                node: expression,
            };
        }

        if (ts.isCallExpression(expression)) {
            return {
                kind: "call",
                node: expression,
            };
        }

        if (ts.isObjectLiteralExpression(expression)) {
            return {
                kind: "object",
                node: expression,
            };
        }

        if (ts.isArrayLiteralExpression(expression)) {
            return {
                kind: "array",
                node: expression,
            };
        }

        if (ts.isArrowFunction(expression)) {
            return {
                kind: "arrow-function",
                node: expression,
            };
        }

        if (ts.isFunctionExpression(expression)) {
            return {
                kind: "function",
                node: expression,
            };
        }

        return {
            kind: "unknown",
            node: expression,
        };
    }

}