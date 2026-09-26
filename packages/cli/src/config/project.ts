import * as path from "node:path";
import { existsSync } from "node:fs";

export interface SpectraProject {
    readonly root: string;
    readonly tsconfigPath: string;
}

export function resolveProject(
    projectRoot: string,
): SpectraProject {
    const root = path.resolve(projectRoot);

    if (!existsSync(root)) {
        throw new Error(
            `Project root does not exist: ${root}`,
        );
    }

    const tsconfigPath = path.join(
        root,
        "tsconfig.json",
    );

    if (!existsSync(tsconfigPath)) {
        throw new Error(
            `No tsconfig.json found in ${root}. ` +
            `Run Spectra from a NestJS project root.`,
        );
    }

    return {
        root,
        tsconfigPath,
    };
}
