import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class PropertyQuery extends NodeQuery<ts.PropertyDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.PropertyDeclaration {

        return ts.isPropertyDeclaration(node);

    }

}