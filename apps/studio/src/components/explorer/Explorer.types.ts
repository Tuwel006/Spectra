/**
 * Barrel re-export for backward compatibility.
 *
 * The canonical types now live in `./types/ExplorerNode.ts` and
 * `./types/ExplorerState.ts`. Existing imports keep working through
 * this re-export so a partial refactor doesn't fan out into every
 * consuming file.
 */
export type {
  ExplorerEndpoint,
  ExplorerTagFolder,
  ExplorerComponentGroup,
  ExplorerServerLeaf,
  ExplorerTagLeaf,
  ExplorerSchemaLeaf,
  ExplorerPlaceholderLeaf,
  ExplorerComponentEntry,
  ExplorerLeaf,
  ExplorerTree,
  ExplorerPathFolder,
  ExplorerNodeKind,
  ExplorerNodeMeta,
  ExplorerSectionId,
} from "./types/ExplorerNode";
export { EXPLORER_SECTION } from "./types/ExplorerNode";

export type {
  ExplorerState,
  ExplorerProps,
  ExplorerSearchEngine,
  ExplorerSnapshot,
} from "./types/ExplorerState";
