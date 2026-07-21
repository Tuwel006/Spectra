import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class FunctionQuery extends NodeQuery<ts.FunctionDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.FunctionDeclaration {

        return ts.isFunctionDeclaration(node);

    }

}