import ts from "typescript";

export class DecoratorReader {

    public getDecorators(
        node: ts.Node,
    ): readonly ts.Decorator[] {

        if (!ts.canHaveDecorators(node)) {
            return [];
        }

        return ts.getDecorators(node) ?? [];

    }

    public has(
        node: ts.Node,
        name: string,
    ): boolean {

        return this.find(node, name) !== undefined;

    }

    public find(
        node: ts.Node,
        name: string,
    ): ts.Decorator | undefined {

        return this.getDecorators(node)
            .find(decorator => this.getName(decorator) === name);

    }

    public getName(
        decorator: ts.Decorator,
    ): string | undefined {

        const expression = decorator.expression;

        if (ts.isIdentifier(expression)) {
            return expression.text;
        }

        if (
            ts.isCallExpression(expression) &&
            ts.isIdentifier(expression.expression)
        ) {
            return expression.expression.text;
        }

        return undefined;

    }

}