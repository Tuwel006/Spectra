import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class InterfaceQuery extends NodeQuery<ts.InterfaceDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.InterfaceDeclaration {

        return ts.isInterfaceDeclaration(node);

    }

}