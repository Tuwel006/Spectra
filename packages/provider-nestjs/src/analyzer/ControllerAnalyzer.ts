import ts from "typescript";
import {
    AstProject,
    NodeWalker,
    ClassQuery,
} from "@spectra/provider-ast";

export class ControllerAnalyzer {

    private readonly classQuery: ClassQuery;

    public constructor(
        project: AstProject,
    ) {

        const walker = new NodeWalker();

        this.classQuery = new ClassQuery(
            walker,
        );

    }

}