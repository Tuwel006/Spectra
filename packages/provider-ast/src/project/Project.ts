export class Project {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  getRootDir(): string {
    return this.rootDir;
  }
}
