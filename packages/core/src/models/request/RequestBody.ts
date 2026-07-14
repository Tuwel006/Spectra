import type { NamedCollection } from "../../types/NamedCollection";
import type { MediaType } from "../media/MediaType";

export interface RequestBody {

  readonly required: boolean;

  /**
   * Supported request formats.
   */
  readonly content: NamedCollection<MediaType>;

}