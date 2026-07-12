export const PrimitiveTypeName = {
  STRING: "string",
  NUMBER: "number",
  BOOLEAN: "boolean",
  BIGINT: "bigint",
  SYMBOL: "symbol",
  NULL: "null",
  UNDEFINED: "undefined",
  VOID: "void",
  ANY: "any",
  UNKNOWN: "unknown",
  NEVER: "never",
} as const;

export type PrimitiveTypeName =
  (typeof PrimitiveTypeName)[keyof typeof PrimitiveTypeName];