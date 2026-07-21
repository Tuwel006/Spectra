import ts from "typescript";
import { AstProject } from "../project";

export class SymbolResolver {

    private readonly checker: ts.TypeChecker;

    public constructor(
        project: AstProject,
    ) {

        this.checker = project.getProgram().getTypeChecker();

    }

    public resolve(
        node: ts.Node,
    ): ts.Symbol | undefined {

        return this.checker.getSymbolAtLocation(node);

    }

}