import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class MethodQuery extends NodeQuery<ts.MethodDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.MethodDeclaration {

        return ts.isMethodDeclaration(node);

    }

}