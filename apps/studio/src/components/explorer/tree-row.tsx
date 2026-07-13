"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TreeRowProps {
  readonly id: string;
  readonly depth: number;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly trailing?: ReactNode;
  readonly expandable?: boolean;
  readonly expanded?: boolean;
  readonly onToggle?: () => void;
  readonly onSelect?: () => void;
  readonly selected?: boolean;
  readonly hoverable?: boolean;
}

/**
 * Single row inside the explorer tree.
 *
 * Designed to be wrapped by `CollapsibleSection` — handles the caret,
 * icon, label and an optional trailing slot. Indentation is applied
 * via a CSS variable so deep trees remain aligned without padding math.
 */
export function TreeRow({
  id,
  depth,
  label,
  icon,
  trailing,
  expandable = false,
  expanded = false,
  onToggle,
  onSelect,
  selected = false,
  hoverable = true,
}: TreeRowProps) {
  const indent = depth * 12 + 8;

  return (
    <div
      data-row-id={id}
      role="treeitem"
      aria-expanded={expandable ? expanded : undefined}
      aria-selected={selected}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (expandable) onToggle?.();
          else onSelect?.();
        }
      }}
      style={{ paddingLeft: indent }}
      className={cn(
        "group flex h-6 items-center gap-1 rounded-sm pr-1 text-xs transition-colors",
        hoverable && "hover:bg-bg-muted",
        selected && "bg-accent-subtle text-accent",
        !selected && "text-text-secondary",
      )}
    >
      <button
        type="button"
        aria-label={expandable ? (expanded ? "Collapse" : "Expand") : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (expandable) onToggle?.();
        }}
        className={cn(
          "flex h-4 w-4 items-center justify-center text-text-muted",
          !expandable && "invisible",
        )}
      >
        {expanded ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          if (expandable) onToggle?.();
          else onSelect?.();
        }}
        className="flex h-full flex-1 items-center gap-1.5 truncate text-left"
      >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </button>

      {trailing ? (
        <span
          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          {trailing}
        </span>
      ) : null}
    </div>
  );
}