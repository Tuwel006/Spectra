import type { NamedCollection } from "../../types/NamedCollection";
import type { MediaType } from "../media/MediaType";

export interface ResponseBody {

  readonly content: NamedCollection<MediaType>;

}