"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui";
import { useExplorerStore } from "@/store/explorer-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/cn";

interface GlobalSearchProps {
  readonly onOpenPalette: () => void;
}

/**
 * Search input rendered in the top bar.
 *
 * - Acts as a shortcut button to open the command palette (cmdk).
 * - Updates the explorer filter so the tree narrows down as the user types.
 */
export function GlobalSearch({ onOpenPalette }: GlobalSearchProps) {
  const explorerSearch = useUiStore((state) => state.explorerSearch);
  const setExplorerSearch = useUiStore((state) => state.setExplorerSearch);
  const expandedNodes = useExplorerStore((state) => state.expandedNodes);

  return (
    <div className="relative flex w-full items-center">
      <Search
        className="pointer-events-none absolute left-2.5 size-3.5 text-text-muted"
        aria-hidden
      />
      <input
        type="text"
        placeholder="Search endpoints, schemas, tags…"
        value={explorerSearch}
        onChange={(event) => setExplorerSearch(event.target.value)}
        onFocus={onOpenPalette}
        className={cn(
          "h-8 w-full rounded-md border border-border bg-bg-subtle pl-8 pr-16 text-sm text-text-primary placeholder:text-text-muted focus:bg-bg-base focus:outline-none focus:ring-2 focus:ring-accent/40",
          Object.keys(expandedNodes).length > 0 && "border-accent/40",
        )}
      />
      <Tooltip content="Open command palette">
        <button
          type="button"
          onClick={onOpenPalette}
          className="absolute right-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-text-muted hover:bg-bg-muted hover:text-text-primary"
        >
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </button>
      </Tooltip>
    </div>
  );
}