"use client";

import * as React from "react";
import { FolderTree } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
        "flex h-full flex-col bg-bg-subtle border-r border-border",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border px-3",
        )}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          <FolderTree className="h-3.5 w-3.5" />
          Explorer
        </div>
        <Badge tone="subtle">TODO</Badge>
      </div>

      {/* Search */}
      <div className="px-3 pt-2">
        <Input variant="search" placeholder="Search endpoints…" size="sm" />
      </div>

      {/* Body placeholder */}
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-xs leading-relaxed text-text-muted">
          API navigation tree will appear here.
          <br />
          <span className="opacity-70">Future phase — no business logic yet.</span>
        </p>
      </div>
    </aside>
  );
}