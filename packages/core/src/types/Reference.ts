import type { Identifier } from "./Identifier";

/**
 * Reference to another object inside the documentation model.
 */
export interface Reference {
  readonly id: Identifier;
}