import ts from "typescript";

export type ExpressionValue =
    | string
    | number
    | boolean
    | null
    | undefined;

export class ExpressionInterpreter {

    public evaluate(
        expression: ts.Expression,
    ): ExpressionValue {

        if (ts.isStringLiteral(expression)) {
            return expression.text;
        }

        if (ts.isNumericLiteral(expression)) {
            return Number(expression.text);
        }

        if (
            expression.kind === ts.SyntaxKind.TrueKeyword
        ) {
            return true;
        }

        if (
            expression.kind === ts.SyntaxKind.FalseKeyword
        ) {
            return false;
        }

        if (
            expression.kind === ts.SyntaxKind.NullKeyword
        ) {
            return null;
        }

        if (
            ts.isPrefixUnaryExpression(expression) &&
            expression.operator === ts.SyntaxKind.MinusToken &&
            ts.isNumericLiteral(expression.operand)
        ) {
            return -Number(expression.operand.text);
        }

        return undefined;
    }

}