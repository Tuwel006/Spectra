import { TypeKind } from "../../constants/TypeKind";
import type { Type } from "./Type";

export interface ArrayType extends Type {
  readonly kind: typeof TypeKind.ARRAY;

  /**
   * Type of each array element.
   */
  readonly elementType: Type;
}