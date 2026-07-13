"use client";

import { Star } from "lucide-react";

import { useExplorerStore } from "@/store/explorer-store";
import { useTabsStore } from "@/store/tabs-store";
import { useUiStore } from "@/store/ui-store";
import { methodLabel } from "@/lib/http";
import { operationKey } from "@/lib/tree";
import { readTags } from "@/types/extension";
import { Button } from "@/components/ui/button";
import { MethodBadge, Tooltip } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { FlatOperation } from "@/lib/tree";
import type { HttpMethod, Identifier } from "@spectra/core";

interface EndpointRowProps {
  readonly operation: FlatOperation;
  readonly depth: number;
  readonly tag?: string;
}

/**
 * Tree row specialised for an HTTP operation.
 *
 * - Click → opens (or focuses) the tab.
 * - Star → toggles favourite.
 */
export function EndpointRow({ operation, depth, tag }: EndpointRowProps) {
  const openTab = useTabsStore((state) => state.openTab);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const favorites = useExplorerStore((state) => state.favorites);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const pushRecent = useExplorerStore((state) => state.pushRecent);

  const key = operationKey(operation.pathId, operation.method);
  const selected = activeTabId === key;
  const isFavorite = favorites.includes(key);

  const handleSelect = () => {
    openTab({
      pathId: operation.pathId,
      method: operation.method,
      url: operation.pathUrl,
      title: operation.name ?? operation.pathUrl,
    });
    pushRecent(key);
  };

  const tags = readTags(operation.extensions);
  const security = readSecurityFromExtensions(operation.extensions);

  return (
    <div
      data-row-id={key}
      role="treeitem"
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          handleSelect();
        }
      }}
      style={{ paddingLeft: depth * 12 + 8 }}
      className={cn(
        "group flex h-6 items-center gap-1.5 rounded-sm pr-1 text-xs transition-colors hover:bg-bg-muted",
        selected && "bg-accent-subtle text-accent",
        !selected && "text-text-secondary",
      )}
    >
      <span className="w-4" aria-hidden />
      <button
        type="button"
        onClick={handleSelect}
        className="flex flex-1 items-center gap-1.5 truncate text-left"
      >
        <MethodBadge method={operation.method} size="xs" />
        <span className="truncate font-mono text-[11px]">{operation.pathUrl}</span>
      </button>
      {security === "BearerAuth" ? (
        <Tooltip content="Requires authentication">
          <span className="text-[9px] text-text-muted">●</span>
        </Tooltip>
      ) : null}
      <Tooltip content={isFavorite ? "Remove from favorites" : "Add to favorites"}>
        <button
          type="button"
          aria-label="Toggle favorite"
          aria-pressed={isFavorite}
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(key);
          }}
          className={cn(
            "opacity-0 transition-opacity group-hover:opacity-100",
            isFavorite && "opacity-100",
          )}
        >
          <Star
            className={cn(
              "size-3",
              isFavorite ? "fill-status-3xx text-status-3xx" : "text-text-muted",
            )}
            aria-hidden
          />
        </button>
      </Tooltip>
      {tag ? null : null}
    </div>
  );
}

/**
 * Reads `x-security` from the operation extensions. Kept as a tiny local
 * helper to avoid an extra import in the row component.
 */
function readSecurityFromExtensions(
  extensions: FlatOperation["extensions"],
): string | null {
  const value = extensions?.["x-security"];
  return typeof value === "string" ? value : null;
}