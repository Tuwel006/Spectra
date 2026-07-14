/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

export { Explorer } from "./Explorer";
export { ExplorerEmpty } from "./ExplorerEmpty";
export { ExplorerFolder } from "./ExplorerFolder";
export { ExplorerFooter } from "./ExplorerFooter";
export { ExplorerHeader } from "./ExplorerHeader";
export { ExplorerItem } from "./ExplorerItem";
export { ExplorerLoading } from "./ExplorerLoading";
export { ExplorerNode } from "./ExplorerNode";
export { ExplorerSearch } from "./ExplorerSearch";
export { ExplorerSection } from "./ExplorerSection";
export { ExplorerTree } from "./ExplorerTree";
export { ExplorerContextMenuTrigger } from "./ExplorerContextMenu";

export type {
  ExplorerEndpointNodeData,
  ExplorerFolderNodeData,
  ExplorerLeafNodeData,
  ExplorerNodeData,
} from "./ExplorerNode";

export type { ExplorerEndpointProps } from "./ExplorerEndpoint";

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

export {
  ExplorerChevronIcon,
  ExplorerClearIcon,
  ExplorerFolderIcon,
  ExplorerLayersIcon,
  ExplorerLeafIcon,
  ExplorerListIcon,
  ExplorerMethodDot,
  ExplorerRouteIcon,
  ExplorerSearchIcon,
  ExplorerSparklesIcon,
  methodLabel,
} from "./ExplorerIcons";

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export { useExplorer } from "./hooks/useExplorer";
export { useExplorerSearch } from "./hooks/useExplorerSearch";
export type { UseExplorerOptions } from "./hooks/useExplorer";

export {
  DEFAULT_DOCUMENTATION,
  buildExplorerTree,
  flattenEndpoints,
  groupByTag,
  groupPathsByPrefix,
} from "./hooks/useExplorer";

export { filterExplorerTree } from "./hooks/useExplorerSearch";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type {
  ExplorerComponentGroup,
  ExplorerComponentEntry,
  ExplorerEndpoint,
  ExplorerLeaf,
  ExplorerNodeKind,
  ExplorerNodeMeta,
  ExplorerPathFolder,
  ExplorerPlaceholderLeaf,
  ExplorerSchemaLeaf,
  ExplorerSectionId,
  ExplorerServerLeaf,
  ExplorerTagFolder,
  ExplorerTagLeaf,
} from "./types/ExplorerNode";

export { EXPLORER_SECTION } from "./types/ExplorerNode";

export type {
  ExplorerProps,
  ExplorerSnapshot,
  ExplorerState,
} from "./types/ExplorerState";

export type { ExplorerSearchEngine } from "./types/ExplorerState";
