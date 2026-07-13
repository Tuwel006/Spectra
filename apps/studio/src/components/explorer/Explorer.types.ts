import type {
  Documentation,
  HttpMethod,
  Operation,
  Path,
  Schema,
  Server,
  Tag,
} from "@spectra/core";

/**
 * Flat representation of a single HTTP operation, ready for the explorer
 * row. Decouples UI from `@spectra/core`'s nested layout.
 */
export interface ExplorerEndpoint {
  /** Stable id — `op_<id>` from the operation, falls back to a derived key. */
  readonly id: string;
  readonly pathId: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly summary?: string;
  readonly tags: readonly string[];
  readonly operation: Operation;
}

export interface ExplorerTagFolder {
  readonly kind: "tag-folder";
  readonly id: string;
  readonly name: string;
  readonly endpoints: readonly ExplorerEndpoint[];
}

export interface ExplorerComponentGroup {
  readonly kind: "component-group";
  readonly id: string;
  readonly name: string;
  readonly entries: readonly ExplorerLeaf[];
}

export interface ExplorerServerLeaf {
  readonly kind: "server";
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly server: Server;
}

export interface ExplorerTagLeaf {
  readonly kind: "tag";
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly tag: Tag;
}

export interface ExplorerSchemaLeaf {
  readonly kind: "schema";
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly schema: Schema;
}

export type ExplorerComponentEntry =
  | ExplorerSchemaLeaf
  | ExplorerTagLeaf
  | ExplorerServerLeaf;

export type ExplorerLeaf =
  | ExplorerComponentEntry
  | ExplorerPlaceholderLeaf;

export interface ExplorerPlaceholderLeaf {
  readonly kind: "placeholder";
  readonly id: string;
  readonly name: string;
}

/**
 * All pre-processed data the explorer tree needs. Computed once via
 * `buildExplorerTree(doc)` so each render stays cheap.
 */
export interface ExplorerTree {
  readonly api: readonly ExplorerTagFolder[];
  readonly components: readonly ExplorerComponentGroup[];
  readonly tags: readonly ExplorerTagLeaf[];
  readonly servers: readonly ExplorerServerLeaf[];
  /** Total endpoint count across all tags — footer display. */
  readonly endpointCount: number;
  /** Distinct URL paths — for context-menu placeholders. */
  readonly pathCount: number;
}

/** Path groups for navigator: groups paths sharing a top-level prefix. */
export interface ExplorerPathFolder {
  readonly id: string;
  readonly name: string;
  readonly pathIds: readonly string[];
}

/**
 * Runtime state managed by the root `<Explorer>` component.
 *
 * `selectedId` is local because the explorer does not yet have a partner
 * endpoint view to broadcast selections to. A future phase can promote
 * this into Zustand when the workspace wires up.
 */
export interface ExplorerState {
  readonly query: string;
  readonly setQuery: (q: string) => void;
  readonly expandedFolders: ReadonlySet<string>;
  readonly toggleFolder: (id: string) => void;
  readonly expandedSections: ReadonlySet<string>;
  readonly toggleSection: (id: string) => void;
  readonly selectedId: string | undefined;
  readonly setSelectedId: (id: string | undefined) => void;
}

export interface ExplorerProps {
  /** Optional override of the documentation to render. Useful in tests. */
  readonly documentation?: Documentation;
  /** Fires when the user activates an endpoint row. Wired up by the host. */
  readonly onEndpointSelect?: (endpoint: ExplorerEndpoint) => void;
  /** Extra class names for the outer container. */
  readonly className?: string;
}
