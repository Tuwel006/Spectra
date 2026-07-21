import type ts from "typescript";
import { AstProject } from "../project";

export class SourceScanner {
  public constructor(
    private readonly project: AstProject,
  ) { }

  public scan(): readonly ts.SourceFile[] {
    return this.project.getSourceFiles();
  }
}