import ts from "typescript";
import { NodeWalker } from "../walker";

export class ClassQuery {
    public constructor(
        private readonly walker: NodeWalker,
    ) { }

    public execute(node: ts.Node): readonly ts.ClassDeclaration[] {
        const classes: ts.ClassDeclaration[] = [];

        this.walker.walk(node, current => {
            if (ts.isClassDeclaration(current)) {
                classes.push(current);
            }
        });

        return classes;
    }
}