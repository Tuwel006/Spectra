import ts from "typescript";

export class NodeWalker {

    public walk(
        node: ts.Node,
        visitor: (node: ts.Node) => void,
    ): void {

        visitor(node);

        ts.forEachChild(node, child => {
            this.walk(child, visitor);
        });

    }

}