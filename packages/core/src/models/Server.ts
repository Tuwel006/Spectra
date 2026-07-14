import type { BaseNode } from "../common/BaseNode.js";

export interface ServerVariable {
  readonly enum?: string[];
  readonly default: string;
  readonly description?: string;
}

export interface Server extends BaseNode {
  readonly url: string;
  readonly description?: string;
  readonly variables?: Record<string, ServerVariable>;
}
