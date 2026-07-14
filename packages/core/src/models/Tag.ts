import type { BaseNode } from "../common/BaseNode";

export interface Tag extends BaseNode {
  readonly name: string;

  readonly description?: string;
}