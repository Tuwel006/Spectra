import ts from "typescript";
import { AstProject } from "../project";
import { SymbolResolver } from "./SymbolResolver";

export class DeclarationResolver {

    private readonly symbolResolver: SymbolResolver;

    public constructor(
        project: AstProject,
    ) {

        this.symbolResolver =
            new SymbolResolver(project);

    }

    public resolve(
        node: ts.Node,
    ): readonly ts.Declaration[] {

        const symbol =
            this.symbolResolver.resolve(node);

        return symbol?.declarations ?? [];

    }

    public resolveClass(
        node: ts.Node,
    ): ts.ClassDeclaration | undefined {

        const declarations =
            this.resolve(node);

        return declarations.find(
            ts.isClassDeclaration,
        );

    }

    public resolveFunction(
        node: ts.Node,
    ): ts.FunctionDeclaration | undefined {

        const declarations =
            this.resolve(node);

        return declarations.find(
            ts.isFunctionDeclaration,
        );

    }

}