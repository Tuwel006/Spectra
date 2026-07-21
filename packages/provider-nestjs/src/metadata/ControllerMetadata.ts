import ts from "typescript";
import { RouteMetadata } from "./RouteMetadata";

export interface ControllerMetadata {

    readonly name: string;

    readonly path: string;

    readonly classNode: ts.ClassDeclaration;

    readonly version?: string;

    readonly tags: readonly string[];

    readonly routes: readonly RouteMetadata[];

}