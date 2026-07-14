import type { BaseNode } from "../../common/BaseNode";
import type { NamedCollection } from "../../types/NamedCollection";
import type { Property } from "./Property";

export interface Schema extends BaseNode {

    /**
     * Schema properties.
     */
    readonly properties: NamedCollection<Property>;

}