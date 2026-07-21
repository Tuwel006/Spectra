import ts from "typescript";
import { HttpMethod } from "@spectra/core";

export interface RouteMetadata {

    readonly name: string;

    readonly path: string;

    readonly method: HttpMethod;

    readonly methodNode: ts.MethodDeclaration;

}