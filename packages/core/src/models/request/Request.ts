import type { Header } from "./Header";
import type { Parameter } from "./Parameter";
import type { RequestBody } from "./RequestBody";

export interface Request {
  /**
   * Path Parameters
   */
  readonly pathParameters: readonly Parameter[];

  /**
   * Query Parameters
   */
  readonly queryParameters: readonly Parameter[];

  /**
   * HTTP Headers
   */
  readonly headers: readonly Header[];

  /**
   * Request Body
   */
  readonly body?: RequestBody;
}