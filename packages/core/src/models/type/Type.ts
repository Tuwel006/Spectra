import type { TypeKind } from "../../constants/TypeKind";

export interface Type {
  readonly kind: TypeKind;
}