import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class VariableQuery extends NodeQuery<ts.VariableDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.VariableDeclaration {

        return ts.isVariableDeclaration(node);

    }

}