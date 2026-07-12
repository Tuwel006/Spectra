import type { BaseNode } from "../common/BaseNode";
import type { Components } from "./Components";
import type { Info } from "./Info";
import type { Server } from "./Server";
import type { Tag } from "./Tag";

export interface Documentation extends BaseNode {
  readonly info: Info;

  readonly servers: readonly Server[];

  readonly tags: readonly Tag[];

  readonly components: Components;

  readonly endpoints: readonly unknown[];
}