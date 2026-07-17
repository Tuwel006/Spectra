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
export { EndpointWorkspace } from "./EndpointWorkspace";
export { EndpointHeader } from "./EndpointHeader";
export { DocumentationSection } from "./DocumentationSection";
export { RequestSection } from "./RequestSection";
export { ResponseSection } from "./ResponseSection";
export { CollapsibleSection } from "./CollapsibleSection";
export { openResource, resolveResourceTitle } from "./openResource";
export { SmartForm } from "./SmartForm";
export { useEndpointUrl, resolveOperationUrl } from "./useEndpointUrl";
export {
  buildInitialValue,
  defaultResolveReference,
  defaultValueFor,
  inferFieldKind,
  parseJsonSafe,
  stringifyJsonSafe,
  type SmartFieldKind,
} from "./smartFormInference";

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
  getUiSlice,
} from "./store/workspaceStore";
export type {
  WorkspaceSectionId,
  WorkspaceUiSlice,
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