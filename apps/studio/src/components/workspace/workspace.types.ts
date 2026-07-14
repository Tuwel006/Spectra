import type { ExplorerEndpoint } from "@/components/explorer/Explorer.types";
import type { HttpMethod, Operation } from "@spectra/core";

/**
 * One row in the workspace tab strip.
 *
 * `endpointId` matches an `Operation.id` from the documentation so the
 * workspace can look up the live operation without re-storing the
 * entire `Operation` object (which would bloat `localStorage`).
 *
 * `pinned` and `dirty` are placeholders — the store supports them but
 * the UI will only render their effects once request / response
 * editing lands. Architecture-only for now.
 */
export interface EndpointTabItem {
  readonly id: string;
  readonly endpointId: string;
  readonly title: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly pinned: boolean;
  readonly dirty: boolean;
}

/** Composite view used by `WorkspaceContent` to render the active tab. */
export interface ResolvedEndpoint {
  readonly tab: EndpointTabItem;
  readonly operation: Operation;
}

export interface WorkspaceProps {
  /** Extra class names for the workspace container. */
  readonly className?: string;
}

/**
 * Map an `ExplorerEndpoint` (the explorer's output) into a tab item.
 * Centralised so the explorer and the menu can both produce tabs.
 */
export function endpointToTab(endpoint: ExplorerEndpoint): EndpointTabItem {
  return {
    id: `tab:${endpoint.id}`,
    endpointId: endpoint.id,
    title: endpoint.summary ?? prettifyUrl(endpoint.url),
    method: endpoint.method,
    url: endpoint.url,
    pinned: false,
    dirty: false,
  };
}

function prettifyUrl(url: string): string {
  return url.replace(/[{}]/g, "").replace(/^\/+/, "");
}
