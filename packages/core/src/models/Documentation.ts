import type { BaseNode } from "../common/BaseNode";
import { NamedCollection } from "../types/NamedCollection";
import type { Components } from "./Components";
import type { Info } from "./Info";
import { Path } from "./path/Path";
import type { Server } from "./Server";
import type { Tag } from "./Tag";

export interface Documentation extends BaseNode {
  readonly info: Info;

  readonly servers: readonly Server[];

  readonly tags: readonly Tag[];

  readonly components: Components;

  readonly paths: NamedCollection<Path>;
}