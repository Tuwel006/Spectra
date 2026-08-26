import ts from "typescript";
import { NodeQuery } from "./NodeQuery";

/**
 * Returns `ts.ParameterDeclaration` nodes that belong to the
 * queried AST node.
 *
 * For method-like inputs (`MethodDeclaration`, `ConstructorDeclaration`,
 * `ArrowFunction`, `FunctionExpression`) the query returns ONLY
 * the direct `parameters` of the function — not nested lambda /
 * callback parameters inside the function body. This addresses the
 * D1 finding ("ParameterQuery over-reach into nested lambda
 * parameters") and was explicitly deferred to E4.
 *
 * For any other input shape (raw `ts.Node`, source file, class
 * declaration, etc.) the query falls back to the recursive walk
 * over all descendants to preserve backward compatibility with
 * callers that pass non-function inputs.
 */
export class ParameterQuery extends NodeQuery<ts.ParameterDeclaration> {

    protected match(
        node: ts.Node,
    ): node is ts.ParameterDeclaration {

        return ts.isParameter(node);

    }

    public override execute(
        node: ts.Node,
    ): readonly ts.ParameterDeclaration[] {

        if (
            ts.isMethodDeclaration(node) ||
            ts.isConstructorDeclaration(node) ||
            ts.isArrowFunction(node) ||
            ts.isFunctionExpression(node) ||
            ts.isFunctionDeclaration(node)
        ) {
            return [...node.parameters];
        }

        return super.execute(node);

    }

}