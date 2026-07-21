import ts from "typescript";
import { NodeWalker } from "../walker";

export class FunctionQuery {

    public constructor(
        private readonly walker: NodeWalker,
    ) { }

    public execute(
        node: ts.Node,
    ): readonly ts.FunctionDeclaration[] {

        const functions: ts.FunctionDeclaration[] = [];

        this.walker.walk(node, current => {

            if (ts.isFunctionDeclaration(current)) {
                functions.push(current);
            }

        });

        return functions;

    }

}