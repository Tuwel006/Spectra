import type { Documentation } from "@spectra/core";

import type {
  ExplorerEndpoint,
  ExplorerSectionId,
  ExplorerTree,
} from "./ExplorerNode";

/**
 * Runtime state managed by the root `<Explorer>` component.
 *
 * The state deliberately exposes a flat shape — no nested objects —
 * so each accessor is stable across renders and memoisation is cheap.
 * Selection lives here too even though the explorer does not yet have
 * a partner endpoint view to broadcast selections to; a future phase
 * can promote this into Zustand when the workspace wires up.
 */
export interface ExplorerState {
  readonly query: string;
  readonly setQuery: (q: string) => void;
  readonly expandedFolders: ReadonlySet<string>;
  readonly toggleFolder: (id: string) => void;
  readonly setExpandedFolders: (ids: readonly string[]) => void;
  readonly expandedSections: ReadonlySet<ExplorerSectionId>;
  readonly toggleSection: (id: ExplorerSectionId) => void;
  readonly setExpandedSections: (ids: readonly ExplorerSectionId[]) => void;
  readonly selectedId: string | undefined;
  readonly setSelectedId: (id: string | undefined) => void;
}

/**
 * Return shape of {@link useExplorer}. Bundles the filtered tree with
 * the state so consumers can destructure once and avoid prop-drilling.
 */
export interface ExplorerSnapshot extends ExplorerState {
  readonly tree: ExplorerTree;
  readonly documentation: Documentation;
  readonly isFiltering: boolean;
  readonly hasResults: boolean;
}

/**
 * Public props for the root `<Explorer>` component. Documented
 * in-place because this is the only seam the layout uses to wire it.
 */
export interface ExplorerProps {
  /** Optional override of the documentation to render. Useful in tests. */
  readonly documentation?: Documentation;
  /** Fires when the user activates an endpoint row. Wired up by the host. */
  readonly onEndpointSelect?: (endpoint: ExplorerEndpoint) => void;
  /** Slot for chrome controls (e.g. a panel collapse button) injected into the header. */
  readonly headerActions?: React.ReactNode;
  /** Extra class names for the outer container. */
  readonly className?: string;
}

/**
 * Search engine contract — kept tiny on purpose so the hook can swap
 * between instant string matching and a future fuzzy match without
 * changing component code.
 */
export interface ExplorerSearchEngine {
  readonly query: string;
  readonly setQuery: (next: string) => void;
  readonly clear: () => void;
  readonly isActive: boolean;
}
