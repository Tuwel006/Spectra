import type { BaseNode } from "../../common/BaseNode";
import type { HttpMethod } from "../../constants/HttpMethod";
import { NamedCollection } from "../../types/NamedCollection";
import { Request } from "../request/Request";
import { Response } from "../response/Response";

export interface Operation extends BaseNode {
  readonly method: HttpMethod;

  readonly summary?: string;

  readonly description?: string;

  readonly operationId?: string;

  readonly request: Request;

  readonly responses: NamedCollection<Response>;
}