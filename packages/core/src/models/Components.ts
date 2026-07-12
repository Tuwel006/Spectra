import { NamedCollection } from "../types/NamedCollection";
import type { Schema } from "./schema/Schema";

export interface Components {
  readonly schemas: NamedCollection<Schema>;

  readonly responses: Record<string, unknown>;

  readonly parameters: Record<string, unknown>;

  readonly requestBodies: Record<string, unknown>;

  readonly headers: Record<string, unknown>;

  readonly examples: Record<string, unknown>;

  readonly securitySchemes: Record<string, unknown>;
}