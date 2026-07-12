import type { Header } from "./Header";
import type { Parameter } from "./Parameter";
import type { RequestBody } from "./RequestBody";

export interface Request {
  /**
   * Path + Query Parameters
   */
  readonly parameters: readonly Parameter[];

  /**
   * HTTP Headers
   */
  readonly headers: readonly Header[];

  /**
   * Request Body
   */
  readonly body?: RequestBody;
}