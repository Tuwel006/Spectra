import type { BaseNode } from "../../common/BaseNode";
import { HttpMethod } from "../../constants";
import type { Operation } from "./Operation";

export interface Path extends BaseNode {
  readonly url: string;

  readonly operations: Partial<Record<HttpMethod, Operation>>;
}