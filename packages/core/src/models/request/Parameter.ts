import type { BaseNode } from "../../common/BaseNode";
import type { ParameterLocation } from "../../constants/ParameterLocation";

export interface Parameter extends BaseNode {

    readonly location: ParameterLocation;

    readonly required:boolean;

    readonly schemaId?:string;

}