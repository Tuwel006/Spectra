import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class ClassQuery extends NodeQuery<ts.ClassDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.ClassDeclaration {

        return ts.isClassDeclaration(node);

    }

}