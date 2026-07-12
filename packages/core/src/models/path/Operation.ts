import type { BaseNode } from "../../common/BaseNode";
import type { HttpMethod } from "../../constants/HttpMethod";
import { Request } from "../request/Request";

export interface Operation extends BaseNode {
  readonly method: HttpMethod;

  readonly summary?: string;

  readonly description?: string;

  readonly operationId?: string;

  readonly request: Request;
}