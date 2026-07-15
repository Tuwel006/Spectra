import type { HttpMethod, Operation } from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Resource types                                                      */
/* ------------------------------------------------------------------ */

/**
 * The set of resources that can be opened in the workspace.
 *
 * Kept as a closed union so the workspace renderer can switch on the
 * discriminator without losing exhaustiveness checks. Add new types
 * here AND wire a resolver in `workspaceStore.ts`.
 */
export type WorkspaceResourceType =
  | "endpoint"
  | "schema"
  | "response"
  | "parameter"
  | "requestBody"
  | "example";

/**
 * Shape of a workspace tab. Only `endpoint` carries HTTP method + URL
 * today; the rest of the fields are reserved for future resource types.
 *
 * `resourceId` is the stable identifier used to re-resolve the
 * underlying object from the mock documentation — for endpoints this
 * is `Operation.id`, for schemas it would be `Schema.id`, etc.
 */
export interface WorkspaceTab {
  readonly id: string;
  readonly resourceType: WorkspaceResourceType;
  readonly resourceId: string;
  readonly title: string;

  /** HTTP method — only set for endpoint tabs. */
  readonly method?: HttpMethod;
  /** Endpoint URL — only set for endpoint tabs. */
  readonly url?: string;

  readonly pinned: boolean;
  readonly dirty: boolean;
}

/* ------------------------------------------------------------------ */
/* Convenience constructors                                            */
/* ------------------------------------------------------------------ */

/**
 * Map an `Operation` row from the explorer into a workspace tab. The
 * explorer never touches the workspace store directly; instead it
 * calls `endpointToTab` and hands the result to the store via
 * `openTab`.
 */
export function endpointToTab(input: {
  readonly endpointId: string;
  readonly title: string;
  readonly method: HttpMethod;
  readonly url: string;
}): WorkspaceTab {
  return {
    id: `tab:${input.endpointId}`,
    resourceType: "endpoint",
    resourceId: input.endpointId,
    title: input.title,
    method: input.method,
    url: input.url,
    pinned: false,
    dirty: false,
  };
}

/* ------------------------------------------------------------------ */
/* Resolved view                                                      */
/* ------------------------------------------------------------------ */

/**
 * Composite view returned by the resolver — a workspace tab plus the
 * live underlying object. Workspace views receive this so they don't
 * have to re-import the documentation module.
 */
export interface ResolvedWorkspaceTab {
  readonly tab: WorkspaceTab;
  readonly operation?: Operation;
}