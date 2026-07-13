import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { ExplorerChevronIcon, ExplorerFolderIcon } from "./ExplorerIcons";

/**
 * Collapsible folder inside the explorer tree. Used for tag folders
 * (e.g. "Authentication"), component groups ("Schemas") and any other
 * nested container. Pure presentation — the tree decides which folder
 * ids are expanded.
 */
export function ExplorerFolder({
  id,
  name,
  count,
  open,
  onToggle,
  emptyHint,
  children,
  level = 0,
}: {
  id: string;
  name: string;
  /** Number of direct children — shown beside the chevron. */
  count?: number;
  open: boolean;
  onToggle: () => void;
  /** Optional caption shown when the folder is open but has no children. */
  emptyHint?: string;
  children: React.ReactNode;
  /** Indentation depth — used for nested folders. */
  level?: number;
}): React.ReactElement {
  const indent = level > 0 ? `pl-${Math.min(level * 2, 8) + 2}` : undefined;

  return (
    <div className={cn("flex flex-col", indent)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className={cn(
          "group flex h-6 w-full items-center gap-1.5 rounded-sm px-2 text-left",
          "text-[11px] font-semibold uppercase tracking-wider text-text-secondary",
          "hover:bg-bg-muted",
        )}
        style={level > 0 ? { paddingLeft: 8 + level * 8 } : undefined}
      >
        <ExplorerChevronIcon open={open} className="h-3 w-3 shrink-0 text-text-muted" />
        <ExplorerFolderIcon
          open={open}
          className={cn(
            "h-3 w-3 shrink-0",
            open ? "text-accent" : "text-text-muted",
          )}
        />
        <span className="flex-1 truncate">{name}</span>
        {typeof count === "number" && count > 0 ? (
          <Badge tone="subtle" size="xs" className="shrink-0">
            {count}
          </Badge>
        ) : null}
      </button>

      {open ? (
        <div
          id={`${id}-panel`}
          role="region"
          className={cn(
            "flex flex-col",
            emptyHint && React.Children.count(children) === 0
              ? "px-3 pb-2"
              : undefined,
          )}
        >
          {children}
          {emptyHint && React.Children.count(children) === 0 ? (
            <p className="px-5 py-1 text-[10px] italic text-text-muted">
              {emptyHint}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
