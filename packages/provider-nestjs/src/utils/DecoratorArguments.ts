import ts from "typescript";

export class DecoratorArguments {

    public get(
        decorator: ts.Decorator,
    ): readonly ts.Expression[] {

        const expression = decorator.expression;

        if (!ts.isCallExpression(expression)) {
            return [];
        }

        return expression.arguments;

    }

}