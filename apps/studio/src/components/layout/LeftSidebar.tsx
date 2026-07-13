"use client";

import * as React from "react";
import { Search, FolderTree } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Left sidebar — placeholder.
 *
 * Layout-only shell. The explorer tree, filters, search and favourites
 * will be implemented in a later phase. Today this just renders the
 * panel chrome and a `<TODO>` body.
 */
export function LeftSidebar(): React.ReactElement {
  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[--color-bg-subtle]",
        "border-r border-[--color-border]",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-9 shrink-0 items-center justify-between gap-2",
          "border-b border-[--color-border] px-3",
        )}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[--color-text-secondary]">
          <FolderTree className="h-3.5 w-3.5" />
          Explorer
        </div>
        <span className="rounded bg-[--color-bg-muted] px-1.5 py-0.5 font-mono text-[10px] text-[--color-text-muted]">
          TODO
        </span>
      </div>

      {/* Search */}
      <div className="px-3 pt-2">
        <label
          className={cn(
            "flex h-7 items-center gap-2 rounded-md border",
            "border-[--color-border] bg-[--color-bg-base] px-2",
            "text-xs text-[--color-text-muted]",
          )}
        >
          <Search className="h-3 w-3" aria-hidden />
          <span>Search endpoints…</span>
        </label>
      </div>

      {/* Body placeholder */}
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-xs leading-relaxed text-[--color-text-muted]">
          API navigation tree will appear here.
          <br />
          <span className="opacity-70">Future phase — no business logic yet.</span>
        </p>
      </div>
    </aside>
  );
}