export const TypeKind = {
  PRIMITIVE: "primitive",
  REFERENCE: "reference",
  ARRAY: "array",
} as const;

export type TypeKind =
  (typeof TypeKind)[keyof typeof TypeKind];