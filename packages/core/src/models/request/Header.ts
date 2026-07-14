import type { BaseNode } from "../../common/BaseNode";

export interface Header extends BaseNode {
  readonly required: boolean;

  readonly schemaId?: string;
}