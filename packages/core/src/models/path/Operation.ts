import type { BaseNode } from "../../common/BaseNode";
import type { HttpMethod } from "../../constants/HttpMethod";
import type { DecoratorUsage } from "../DecoratorUsage";
import type { NamedCollection } from "../../types/NamedCollection";
import type { Request } from "../request/Request";
import type { Response } from "../response/Response";

export interface Operation extends BaseNode {
  readonly method: HttpMethod;

  readonly summary?: string;

  readonly description?: string;

  readonly operationId?: string;

  readonly request: Request;

  readonly responses: NamedCollection<Response>;

  /**
   * Effective guards for this operation: class-level `@UseGuards` PLUS
   * method-level `@UseGuards`, deduplicated in source order.
   * Empty when no guard is applied to either scope.
   */
  readonly guards?: readonly DecoratorUsage[];

  /**
   * Effective pipes for this operation: class-level + method-level.
   */
  readonly pipes?: readonly DecoratorUsage[];

  /**
   * Effective interceptors: class-level + method-level.
   */
  readonly interceptors?: readonly DecoratorUsage[];

  /**
   * Effective exception filters: class-level + method-level.
   */
  readonly filters?: readonly DecoratorUsage[];
}