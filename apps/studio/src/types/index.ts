import type { HttpMethod, Operation, Path } from "@spectra/core";

/**
 * A resolved endpoint: a Path + a specific Operation + the URL.
 * This is the primary unit of work inside the Studio.
 */
export interface EndpointEntry {
  readonly pathId: string;
  readonly url: string;
  readonly method: HttpMethod;
  readonly operation: Operation;
}

/**
 * An open tab in the workspace.
 * Tabs map 1-to-1 with EndpointEntry but carry additional UI state.
 */
export interface Tab {
  readonly id: string; // unique tab id: `${pathId}::${method}`
  readonly endpoint: EndpointEntry;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
}

/**
 * Explorer tree node variants.
 */
export type ExplorerNodeKind =
  | "group"      // logical group header (e.g. "Authentication")
  | "path"       // a path with one or more operations
  | "operation"  // individual HTTP method + path
  | "schema"     // a component schema
  | "server"     // server entry
  | "tag";       // tag entry

export interface ExplorerNode {
  readonly id: string;
  readonly label: string;
  readonly kind: ExplorerNodeKind;
  readonly children?: readonly ExplorerNode[];
  readonly endpoint?: EndpointEntry;
  readonly icon?: string;
  readonly count?: number;
}

/**
 * A collapsed/expanded record — keyed by node id.
 */
export type ExpansionState = Record<string, boolean>;

/**
 * Layout panel names for persisting widths.
 */
export type PanelId = "left-sidebar" | "right-sidebar";
