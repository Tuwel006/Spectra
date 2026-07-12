import type { BaseNode } from "../../common/BaseNode";
import type { Type } from "../type/Type";
import type { PropertyModifier } from "./PropertyModifier";

export interface Property extends BaseNode {

    /**
     * Type of the property's value.
     */
    readonly valueType: Type;

    /**
     * Property modifiers.
     */
    readonly modifiers: PropertyModifier;

}