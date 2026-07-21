import { Documentation } from "@spectra/core";
import { Project } from "../project/Project";

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
