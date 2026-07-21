import ts from "typescript";
import { NodeWalker } from "../walker";

export abstract class NodeQuery<T extends ts.Node> {

    public constructor(
        protected readonly walker: NodeWalker,
    ) { }

    protected abstract match(
        node: ts.Node,
    ): node is T;

    public execute(
        node: ts.Node,
    ): readonly T[] {

        const result: T[] = [];

        this.walker.walk(node, current => {

            if (this.match(current)) {
                result.push(current);
            }

        });

        return result;

    }

}