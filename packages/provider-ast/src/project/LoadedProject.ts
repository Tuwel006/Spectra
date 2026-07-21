import type ts from "typescript";

export interface LoadedProject {
    readonly program: ts.Program;
    readonly checker: ts.TypeChecker;
    readonly sourceFiles: readonly ts.SourceFile[];
}