import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class ParameterQuery extends NodeQuery<ts.ParameterDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.ParameterDeclaration {

        return ts.isParameter(node);

    }

}