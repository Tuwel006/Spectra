import { TypeKind } from "../../constants/TypeKind";
import type { PrimitiveTypeName } from "../../constants/PrimitiveTypeName";
import type { Type } from "./Type";

export interface PrimitiveType extends Type {
  readonly kind: typeof TypeKind.PRIMITIVE;

  readonly name: PrimitiveTypeName;
}