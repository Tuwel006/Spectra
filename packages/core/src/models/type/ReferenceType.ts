import { TypeKind } from "../../constants/TypeKind";
import type { Reference } from "../../types/Reference";
import type { Type } from "./Type";

export interface ReferenceType extends Type {
  readonly kind: typeof TypeKind.REFERENCE;

  readonly reference: Reference;
}