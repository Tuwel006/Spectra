import type { Extensions } from "./Extension";
import type { Metadata } from "./Metadata";

export interface BaseNode {
  readonly id: string;

  readonly name?: string;

  readonly description?: string;

  readonly metadata?: Metadata;

  readonly extensions?: Extensions;
}