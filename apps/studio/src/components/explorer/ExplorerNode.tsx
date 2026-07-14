import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { methodLabel } from "@/lib/http";
import type { HttpMethod } from "@spectra/core";

import { MethodBadge } from "@/components/ui/badge";

import { ExplorerChevronIcon, ExplorerFolderIcon, ExplorerLeafIcon } from "./ExplorerIcons";
import type {
  ExplorerEndpoint,
  ExplorerNodeKind,
} from "./types/ExplorerNode";

/* ------------------------------------------------------------------ */
/* Discriminated node contract                                         */
/* ------------------------------------------------------------------ */

export interface ExplorerFolderNodeData {
  readonly kind: "folder";
  readonly id: string;
  readonly name: string;
  readonly count: number;
  readonly depth: number;
  readonly open: boolean;
  readonly onToggle: () => void;
}

export interface ExplorerEndpointNodeData {
  readonly kind: "endpoint";
  readonly endpoint: ExplorerEndpoint;
  readonly depth: number;
  readonly selected: boolean;
  readonly onActivate: (endpoint: ExplorerEndpoint) => void;
}

export interface ExplorerLeafNodeData {
  readonly kind: "leaf";
  readonly id: string;
  readonly name: string;
  readonly secondary?: string;
  readonly iconKind:
    | "schema"
    | "tag"
    | "server"
    | "response"
    | "parameter"
    | "requestBody"
    | "favorites"
    | "recent"
    | "settings"
    | "components"
    | "placeholder";
  readonly depth: number;
  readonly onSelect?: () => void;
}

export type ExplorerNodeData =
  | ExplorerFolderNodeData
  | ExplorerEndpointNodeData
  | ExplorerLeafNodeData;

/**
 * Single dispatcher used by `ExplorerTree`. Renders the right node
 * shape for each entry while keeping the memoisation key stable per
 * row (id + open/selected). Children that share state stay referentially
 * equal across renders so React doesn't rebuild them on every keystroke.
 */
function ExplorerNodeInner(
  props: ExplorerNodeData,
): React.ReactElement {
  switch (props.kind) {
    case "folder":
      return <FolderNode {...props} />;
    case "endpoint":
      return <EndpointNode {...props} />;
    case "leaf":
      return <LeafNode {...props} />;
  }
}

export const ExplorerNode = React.memo(ExplorerNodeInner);
ExplorerNode.displayName = "ExplorerNode";

/* ------------------------------------------------------------------ */
/* Folder node                                                         */
/* ------------------------------------------------------------------ */

const FolderNode = React.memo(function FolderNode({
  id,
  name,
  count,
  depth,
  open,
  onToggle,
}: ExplorerFolderNodeData): React.ReactElement {
  const indent = depth > 0 ? 8 + depth * 8 : undefined;
  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        style={indent !== undefined ? { paddingLeft: indent } : undefined}
        className={cn(
          "group flex h-6 w-full items-center gap-1.5 rounded-sm px-2 text-left",
          "text-[11px] font-semibold uppercase tracking-wider text-text-secondary",
          "transition-colors hover:bg-bg-muted",
        )}
      >
        <ExplorerChevronIcon
          open={open}
          className={cn(
            "h-3 w-3 shrink-0 text-text-muted transition-transform duration-150",
          )}
        />
        <ExplorerFolderIcon
          open={open}
          className={cn(
            "h-3 w-3 shrink-0 transition-colors",
            open ? "text-accent" : "text-text-muted",
          )}
        />
        <span className="flex-1 truncate">{name}</span>
        {count > 0 ? (
          <Badge tone="subtle" size="xs" className="shrink-0">
            {count}
          </Badge>
        ) : null}
      </button>
    </div>
  );
});
FolderNode.displayName = "ExplorerNode.Folder";

/* ------------------------------------------------------------------ */
/* Endpoint node                                                       */
/* ------------------------------------------------------------------ */

const EndpointNode = React.memo(function EndpointNode({
  endpoint,
  depth,
  selected,
  onActivate,
}: ExplorerEndpointNodeData): React.ReactElement {
  const label = methodLabel(endpoint.method);
  const indent = depth > 0 ? 8 + depth * 12 : 20;
  return (
    <button
      type="button"
      onClick={() => onActivate(endpoint)}
      aria-current={selected || undefined}
      style={{ paddingLeft: indent }}
      className={cn(
        "group flex w-full items-start gap-2 rounded-sm py-1 pr-3 text-left",
        "text-xs text-text-secondary",
        "transition-colors hover:bg-bg-muted",
        "focus:outline-none focus-visible:bg-bg-muted",
        selected
          ? "bg-accent-subtle text-accent hover:bg-accent-subtle"
          : undefined,
      )}
    >
      <MethodBadge
        method={label as HttpMethodColorLike}
        size="xs"
        className="mt-0.5 shrink-0"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate font-mono text-[11px]",
            selected ? "text-accent" : "text-text-primary",
          )}
        >
          {endpoint.url}
        </span>
        {endpoint.summary ? (
          <span className="truncate text-[10px] text-text-muted">
            {endpoint.summary}
          </span>
        ) : null}
      </span>
    </button>
  );
});
EndpointNode.displayName = "ExplorerNode.Endpoint";

/* ------------------------------------------------------------------ */
/* Leaf node (schemas, tags, servers, placeholders)                    */
/* ------------------------------------------------------------------ */

const LeafNode = React.memo(function LeafNode({
  id: _id,
  name,
  secondary,
  iconKind,
  depth,
  onSelect,
}: ExplorerLeafNodeData): React.ReactElement {
  const indent = depth > 0 ? 8 + depth * 12 : 20;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ paddingLeft: indent }}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-sm py-1 pr-3 text-left",
        "text-xs text-text-secondary",
        "transition-colors hover:bg-bg-muted hover:text-text-primary",
        "focus:outline-none focus-visible:bg-bg-muted",
      )}
    >
      <ExplorerLeafIcon
        kind={iconKind}
        className="h-3 w-3 shrink-0 text-text-muted"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        {secondary ? (
          <span className="truncate text-[10px] text-text-muted">
            {secondary}
          </span>
        ) : null}
      </span>
    </button>
  );
});
LeafNode.displayName = "ExplorerNode.Leaf";

/* ------------------------------------------------------------------ */
/* Narrowing helper for MethodBadge                                    */
/* ------------------------------------------------------------------ */

/**
 * `MethodBadge` accepts the `HttpMethodColor` subset of `HttpMethod`.
 * We pre-validate upstream so a stray TRACE/CONNECT method never
 * reaches the badge — narrow the type locally to keep `MethodBadge`'s
 * API stable.
 */
type HttpMethodColorLike = Parameters<typeof MethodBadge>[0]["method"];

/* ------------------------------------------------------------------ */
/* Node kind helper                                                    */
/* ------------------------------------------------------------------ */

/**
 * Map a generic node kind to the icon variant rendered for leaves.
 * Centralised so future additions (parameters, request bodies) only
 * touch one file.
 */
export function iconKindFor(
  kind: ExplorerNodeKind,
): ExplorerLeafNodeData["iconKind"] {
  switch (kind) {
    case "schema":
      return "schema";
    case "tag":
    case "tag-folder":
      return "tag";
    case "server":
      return "server";
    case "placeholder":
      return "placeholder";
    case "component-group":
    case "section":
      return "components";
    case "endpoint":
      return "schema";
  }
}
