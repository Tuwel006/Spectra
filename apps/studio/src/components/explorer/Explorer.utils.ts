/**
 * Re-export the public surface from the new module layout.
 *
 * The implementation moved into `./hooks/useExplorer.ts` and
 * `./hooks/useExplorerSearch.ts` so state, tree building and search
 * each live in their own file. Existing callers can keep importing
 * from `Explorer.utils` without churn.
 */
export {
  DEFAULT_DOCUMENTATION,
  buildExplorerTree,
  flattenEndpoints,
  groupByTag,
  groupPathsByPrefix,
  useExplorer,
} from "./hooks/useExplorer";

export type { UseExplorerOptions } from "./hooks/useExplorer";

export { filterExplorerTree, useExplorerSearch } from "./hooks/useExplorerSearch";

export type {
  ExplorerComponentGroup,
  ExplorerEndpoint,
  ExplorerLeaf,
  ExplorerProps,
  ExplorerSchemaLeaf,
  ExplorerServerLeaf,
  ExplorerState,
  ExplorerTagFolder,
  ExplorerTagLeaf,
  ExplorerTree,
} from "./Explorer.types";
