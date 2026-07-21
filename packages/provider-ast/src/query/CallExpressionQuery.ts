import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

export class CallExpressionQuery extends NodeQuery<ts.CallExpression> {

    protected match(
        node: ts.Node,
    ): node is ts.CallExpression {

        return ts.isCallExpression(node);

    }

}