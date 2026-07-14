import type { ContentType } from "../../constants/ContentType";
import type { Reference } from "../../types/Reference";

export interface MediaType {

  /**
   * HTTP content type.
   * Example:
   * application/json
   */
  readonly contentType: ContentType;

  /**
   * Schema describing the body.
   */
  readonly schema?: Reference;

}