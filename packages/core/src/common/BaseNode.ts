import { Identifier } from "../types/Identifier";
import type { Extensions } from "./Extension";
import type { Metadata } from "./Metadata";

export interface BaseNode {
  readonly id: Identifier;

  readonly name?: string;

  readonly description?: string;

  readonly metadata?: Metadata;

  readonly extensions?: Extensions;
}