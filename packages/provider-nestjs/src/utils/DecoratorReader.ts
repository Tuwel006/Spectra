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

}