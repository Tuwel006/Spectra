export interface Components {
  readonly schemas: Record<string, unknown>;

  readonly responses: Record<string, unknown>;

  readonly parameters: Record<string, unknown>;

  readonly requestBodies: Record<string, unknown>;

  readonly headers: Record<string, unknown>;

  readonly examples: Record<string, unknown>;

  readonly securitySchemes: Record<string, unknown>;
}