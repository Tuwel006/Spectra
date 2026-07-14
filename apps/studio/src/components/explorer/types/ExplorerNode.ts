import type {
  HttpMethod,
  Operation,
  Path,
  Schema,
  Server,
  Tag,
} from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Tree primitives                                                     */
/* ------------------------------------------------------------------ */

/**
 * Discriminator for every node the explorer can render. New shapes
 * (lazy-loaded children, virtualised windows, etc.) plug in here
 * without disturbing consumers that switch on `node.kind`.
 */
export type ExplorerNodeKind =
  | "section"
  | "tag-folder"
  | "component-group"
  | "schema"
  | "tag"
  | "server"
  | "endpoint"
  | "placeholder";

/**
 * Lightweight metadata shared by every node — id for state lookup,
 * label for display, depth for indentation.
 */
export interface ExplorerNodeMeta {
  readonly id: string;
  readonly kind: ExplorerNodeKind;
  readonly label: string;
  readonly depth: number;
}

/**
 * Flat representation of a single HTTP operation, ready for the explorer
 * row. Decouples UI from `@spectra/core`'s nested layout.
 */
export interface ExplorerEndpoint {
  readonly kind: "endpoint";
  /** Stable id — `op_<id>` from the operation, falls back to a derived key. */
  readonly id: string;
  readonly pathId: Path["id"];
  readonly method: HttpMethod;
  readonly url: string;
  readonly summary?: string;
  readonly operationId?: string;
  readonly tags: readonly string[];
  readonly operation: Operation;
}

/**
 * Tag folder — Authentication, Users, Orders, … — groups endpoints
 * that share the same `tag` declaration in the source documentation.
 */
export interface ExplorerTagFolder {
  readonly kind: "tag-folder";
  readonly id: string;
  readonly name: string;
  readonly endpoints: readonly ExplorerEndpoint[];
}

/**
 * Sub-group inside the Components section: Schemas, Responses,
 * Parameters, Request Bodies, etc.
 */
export interface ExplorerComponentGroup {
  readonly kind: "component-group";
  readonly id: string;
  readonly name: string;
  readonly entries: readonly ExplorerLeaf[];
}

/* ------------------------------------------------------------------ */
/* Leaves                                                              */
/* ------------------------------------------------------------------ */

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

export interface ExplorerPlaceholderLeaf {
  readonly kind: "placeholder";
  readonly id: string;
  readonly name: string;
}

export type ExplorerComponentEntry =
  | ExplorerSchemaLeaf
  | ExplorerTagLeaf
  | ExplorerServerLeaf;

export type ExplorerLeaf =
  | ExplorerComponentEntry
  | ExplorerPlaceholderLeaf;

/* ------------------------------------------------------------------ */
/* Top-level tree                                                      */
/* ------------------------------------------------------------------ */

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

/**
 * Path groups for navigator: groups paths sharing a top-level prefix.
 * Used by breadcrumbs / context-menu helpers. Not rendered yet but
 * kept here so the type lives next to the rest of the tree shape.
 */
export interface ExplorerPathFolder {
  readonly id: string;
  readonly name: string;
  readonly pathIds: readonly string[];
}

/* ------------------------------------------------------------------ */
/* Section identifiers                                                 */
/* ------------------------------------------------------------------ */

/**
 * Stable identifiers for the explorer sections — declared here so
 * consumers don't have to inline strings. Mirrors the spec layout.
 */
export const EXPLORER_SECTION = {
  API: "section:api",
  Components: "section:components",
  Tags: "section:tags",
  Servers: "section:servers",
  Favorites: "section:favorites",
  Recent: "section:recent",
  Settings: "section:settings",
} as const;

export type ExplorerSectionId =
  (typeof EXPLORER_SECTION)[keyof typeof EXPLORER_SECTION];
