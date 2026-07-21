import { Documentation } from "@spectra/core";
import { AstProject as Project } from "../project/AstProject";

export class SourceScanner {
  private project: Project;

  constructor(project: Project) {
    this.project = project;
  }

  async scan(): Promise<Documentation | null> {
    // TODO: Implement AST scanning logic
    return null;
  }
}
