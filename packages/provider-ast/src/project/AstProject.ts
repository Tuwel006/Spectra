import * as path from "node:path";
import ts from "typescript";
import type { LoadedProject } from "./LoadedProject";
import type { ProjectOptions } from "./ProjectOptions";

export class AstProject {
    private readonly project: LoadedProject;

    public constructor(options: ProjectOptions) {
        this.project = this.load(options);
    }

    public getProgram(): ts.Program {
        return this.project.program;
    }

    public getTypeChecker(): ts.TypeChecker {
        return this.project.checker;
    }

    public getSourceFiles(): readonly ts.SourceFile[] {
        return this.project.sourceFiles;
    }

    private load(options: ProjectOptions): LoadedProject {
        const config = ts.readConfigFile(
            options.tsconfigPath,
            ts.sys.readFile,
        );

        if (config.error) {
            throw new Error(
                ts.flattenDiagnosticMessageText(
                    config.error.messageText,
                    "\n",
                ),
            );
        }

        // Resolve relative paths in the tsconfig against the
        // tsconfig file's own directory, not against `process.cwd()`.
        // Otherwise running the AST scanner from a different
        // working directory would silently load the wrong source
        // files (or none at all).
        const tsconfigDirectory = path.dirname(
            path.resolve(options.tsconfigPath),
        );

        const parsed = ts.parseJsonConfigFileContent(
            config.config,
            ts.sys,
            tsconfigDirectory,
        );

        const program = ts.createProgram({
            rootNames: parsed.fileNames,
            options: parsed.options,
        });

        return {
            program,
            checker: program.getTypeChecker(),
            sourceFiles: program
                .getSourceFiles()
                .filter(file => !file.isDeclarationFile),
        };
    }
}