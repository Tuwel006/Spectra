import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class EnumQuery extends NodeQuery<ts.EnumDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.EnumDeclaration {

        return ts.isEnumDeclaration(node);

    }

}