import * as React from "react";
import { methodLabel } from "@/lib/http";
import type { HttpMethod } from "@spectra/core";

import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { ExplorerContextMenuTrigger } from "./ExplorerContextMenu";
import type { ExplorerEndpoint } from "./Explorer.types";

/**
 * Public prop shape for the standalone `ExplorerEndpoint` row.
 * Exported separately so consumers can pass the data through without
 * importing the (currently named-identically) data type.
 */
export interface ExplorerEndpointProps {
  endpoint: ExplorerEndpoint;
  selected?: boolean;
  onActivate?: (endpoint: ExplorerEndpoint) => void;
}

/**
 * Single HTTP operation row inside a tag folder.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ [GET]  /users/{id}            Get User ············· ⌘    │
 *   │        Get detailed information about a specific user.      │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Visual states: idle, hover, focus, selected.
 *
 * Kept for backward compatibility — the tree now renders rows via
 * `ExplorerNode`, but this component is still useful when an endpoint
 * needs to appear outside the tree (search results, context menus).
 */
export function ExplorerEndpoint({
  endpoint,
  selected,
  onActivate,
}: ExplorerEndpointProps): React.ReactElement {
  const label = methodLabel(endpoint.method);
  return (
    <button
      type="button"
      onClick={() => onActivate?.(endpoint)}
      aria-current={selected || undefined}
      className={cn(
        "group flex w-full items-start gap-2 rounded-sm px-5 py-1 text-left",
        "text-xs text-text-secondary",
        "hover:bg-bg-muted",
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
      <ExplorerContextMenuTrigger
        ariaLabel={`Actions for ${label} ${endpoint.url}`}
      />
    </button>
  );
}

/**
 * `MethodBadge` accepts the `HttpMethodColor` subset of `HttpMethod`.
 * We pre-validate upstream so a stray TRACE/CONNECT method never reaches
 * the badge — narrow the type locally to keep `MethodBadge`'s API
 * stable.
 */
type HttpMethodColorLike = Parameters<typeof MethodBadge>[0]["method"];
