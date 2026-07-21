import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class ImportQuery extends NodeQuery<ts.ImportDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.ImportDeclaration {

        return ts.isImportDeclaration(node);

    }
}