/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

export { Workspace } from "./Workspace";
export { WorkspaceHeader } from "./WorkspaceHeader";
export { WorkspaceEmpty } from "./WorkspaceEmpty";
export { WorkspaceContent } from "./WorkspaceContent";
export { WorkspaceTabs } from "./WorkspaceTabs";
export { WorkspaceTab } from "./WorkspaceTab";
export type { WorkspaceTabProps } from "./WorkspaceTab";
export {
  EndpointOverview,
  readOperationTagsAndAuth,
} from "./EndpointOverview";

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export { useWorkspace, useResolvedWorkspaceTab } from "./hooks/useWorkspace";
export type {
  UseWorkspaceResult,
  UseResolvedWorkspaceTabResult,
} from "./hooks/useWorkspace";

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export {
  useWorkspaceStore,
  resolveOperation,
  useHasMounted,
} from "./store/workspaceStore";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type {
  WorkspaceTab as WorkspaceTabData,
  WorkspaceResourceType,
  ResolvedWorkspaceTab,
} from "./types/Workspace";
export { endpointToTab } from "./types/Workspace";