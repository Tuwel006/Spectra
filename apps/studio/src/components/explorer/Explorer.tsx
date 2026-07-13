"use client";

import * as React from "react";
import { Search, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Input } from "@/components/ui/Input";
import { ExplorerNodeItem } from "./ExplorerNodeItem";
import { useExplorerStore } from "@/store/explorer.store";
import { useExplorerTree } from "@/hooks/useExplorerTree";
import type { ExplorerNode } from "@/types";

/**
 * Recursively filters the explorer tree by a search query.
 * A node is included if its label, or any descendant's label, matches.
 */
function filterTree(nodes: readonly ExplorerNode[], query: string): ExplorerNode[] {
  const q = query.toLowerCase();
  return nodes.flatMap((node) => {
    const labelMatch = node.label.toLowerCase().includes(q);
    const filteredChildren = node.children ? filterTree(node.children, query) : [];

    if (labelMatch) return [{ ...node, children: node.children }];
    if (filteredChildren.length > 0) return [{ ...node, children: filteredChildren }];
    return [];
  });
}

/**
 * The left-panel API Explorer.
 * Renders the tree, search, and expand/collapse controls.
 */
export function Explorer() {
  const nodes = useExplorerTree();
  const { searchQuery, setSearchQuery, expandAll, collapseAll, expansion } =
    useExplorerStore();

  const displayNodes = React.useMemo(
    () => (searchQuery.trim() ? filterTree(nodes, searchQuery) : nodes),
    [nodes, searchQuery]
  );

  // When searching, auto-expand all matching groups
  React.useEffect(() => {
    if (searchQuery.trim()) expandAll(displayNodes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center justify-between px-3 border-b border-[--color-border]">
        <span className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
          APIs
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip content="Expand all" side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => expandAll(nodes)}
              aria-label="Expand all"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Collapse all" side="bottom">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={collapseAll}
              aria-label="Collapse all"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 rotate-90" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-[--color-border]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[--color-text-muted]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search endpoints…"
            className="pl-7 h-7 text-xs"
            aria-label="Search endpoints"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary]"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1 px-1">
        {displayNodes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-6 w-6 text-[--color-text-disabled]" />
            <p className="text-xs text-[--color-text-muted]">No results for &ldquo;{searchQuery}&rdquo;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[--color-accent] hover:underline"
            >
              Clear search
            </button>
          </div>
        ) : (
          displayNodes.map((node) => (
            <ExplorerNodeItem key={node.id} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
