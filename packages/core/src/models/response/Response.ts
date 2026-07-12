import type { Header } from "../request/Header";
import type { ResponseBody } from "./ResponseBody";

export interface Response {

  /**
   * Human readable description.
   * Example:
   * Successfully fetched user.
   */
  readonly description?: string;

  /**
   * Response Headers
   */
  readonly headers: readonly Header[];

  /**
   * Response Body
   */
  readonly body?: ResponseBody;

}