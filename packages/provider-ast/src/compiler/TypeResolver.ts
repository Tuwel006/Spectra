import ts from "typescript";
import { AstProject } from "../project";

export class TypeResolver {

    private readonly checker: ts.TypeChecker;

    public constructor(
        project: AstProject,
    ) {

        this.checker = project.getProgram().getTypeChecker();

    }

    public resolve(
        node: ts.Node,
    ): ts.Type {

        return this.checker.getTypeAtLocation(node);

    }

}