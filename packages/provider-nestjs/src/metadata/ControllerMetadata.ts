export interface ControllerMetadata {

    readonly name: string;

    readonly path: string;

    readonly classNode: ts.ClassDeclaration;

}