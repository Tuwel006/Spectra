import ts from "typescript";

export type ExpressionKind =
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "identifier"
    | "property-access"
    | "element-access"
    | "call"
    | "object"
    | "array"
    | "arrow-function"
    | "function"
    | "prefix-unary"
    | "template"
    | "regex"
    | "new"
    | "conditional"
    | "binary"
    | "postfix-unary"
    | "as-expression"
    | "spread"
    | "class"
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

        if (ts.isPrefixUnaryExpression(expression)) {
            return {
                kind: "prefix-unary",
                node: expression,
            };
        }

        if (
            ts.isTypeOfExpression(expression) ||
            ts.isVoidExpression(expression) ||
            ts.isDeleteExpression(expression)
        ) {
            return {
                kind: "prefix-unary",
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

        if (ts.isElementAccessExpression(expression)) {
            return {
                kind: "element-access",
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

        if (ts.isNoSubstitutionTemplateLiteral(expression)) {
            return {
                kind: "template",
                node: expression,
            };
        }

        if (ts.isTemplateExpression(expression)) {
            return {
                kind: "template",
                node: expression,
            };
        }

        if (ts.isRegularExpressionLiteral(expression)) {
            return {
                kind: "regex",
                node: expression,
            };
        }

        if (ts.isNewExpression(expression)) {
            return {
                kind: "new",
                node: expression,
            };
        }

        if (ts.isConditionalExpression(expression)) {
            return {
                kind: "conditional",
                node: expression,
            };
        }

        if (ts.isBinaryExpression(expression)) {
            return {
                kind: "binary",
                node: expression,
            };
        }

        if (ts.isPostfixUnaryExpression(expression)) {
            return {
                kind: "postfix-unary",
                node: expression,
            };
        }

        if (ts.isAsExpression(expression)) {
            return {
                kind: "as-expression",
                node: expression,
            };
        }

        if (ts.isTypeAssertionExpression(expression)) {
            return {
                kind: "as-expression",
                node: expression,
            };
        }

        if (ts.isNonNullExpression(expression)) {
            return {
                kind: "as-expression",
                node: expression,
            };
        }

        if (ts.isClassExpression(expression)) {
            return {
                kind: "class",
                node: expression,
            };
        }

        return {
            kind: "unknown",
            node: expression,
        };
    }

}