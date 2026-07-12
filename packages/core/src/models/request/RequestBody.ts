import { ContentType } from "../../constants/ContentType";

export interface RequestBody {

    readonly required:boolean;

    readonly contentType: ContentType;

    readonly schemaId?:string;

}