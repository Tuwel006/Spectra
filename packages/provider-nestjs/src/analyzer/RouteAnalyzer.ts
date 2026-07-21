import { MethodQuery } from "@spectra/provider-ast";

import { ControllerMetadata, RouteMetadata } from "../metadata";
import { DecoratorReader } from "../utils";

export class RouteAnalyzer {

    public constructor(
        private readonly methodQuery: MethodQuery,
        private readonly decoratorReader: DecoratorReader,
    ) { }

    public analyze(
        controller: ControllerMetadata,
    ): readonly RouteMetadata[] {

        const routes: RouteMetadata[] = [];

        const methods =
            this.methodQuery.execute(
                controller.classNode,
            );

        for (const methodNode of methods) {

            const httpMethod =
                this.getHttpMethod(methodNode);

            if (!httpMethod) {
                continue;
            }

            routes.push({

                name:
                    methodNode.name.getText(),

                path: "",

                method: httpMethod,

                methodNode,

            });

        }

        return routes;

    }

    private getHttpMethod(
        methodNode: import("typescript").MethodDeclaration,
    ) {

        if (this.decoratorReader.has(methodNode, "Get")) {
            return "GET";
        }

        if (this.decoratorReader.has(methodNode, "Post")) {
            return "POST";
        }

        if (this.decoratorReader.has(methodNode, "Put")) {
            return "PUT";
        }

        if (this.decoratorReader.has(methodNode, "Patch")) {
            return "PATCH";
        }

        if (this.decoratorReader.has(methodNode, "Delete")) {
            return "DELETE";
        }

        return undefined;

    }

}