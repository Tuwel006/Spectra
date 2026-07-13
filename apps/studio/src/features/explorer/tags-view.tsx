"use client";

import { useMemo } from "react";

import { Hash, Search } from "lucide-react";
import { mockDocumentation } from "@/mock/documentation";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";
import { Tree, type TreeNode } from "@/components/explorer/tree";
import { useUiStore } from "@/store/ui-store";

/**
 * Tags explorer view — surfaces every tag declared in the documentation
 * along with its description.
 */
export function TagsView() {
  const search = useUiStore((state) => state.explorerSearch).trim().toLowerCase();

  const tags = useMemo(
    () =>
      mockDocumentation.tags.filter(
        (tag) =>
          !search ||
          tag.name.toLowerCase().includes(search) ||
          (tag.description?.toLowerCase().includes(search) ?? false),
      ),
    [search],
  );

  if (tags.length === 0) {
    return (
      <EmptyState
        icon={<Search className="size-4" aria-hidden />}
        title="No tags"
        description="No tags match the current filter."
      />
    );
  }

  const tree: TreeNode[] = tags.map((tag) => ({
    id: `tag-${tag.id}`,
    label: (
      <span className="flex items-center gap-1.5">
        <Hash className="size-3 text-text-muted" aria-hidden />
        <span className="truncate">{tag.name}</span>
        <Badge variant="subtle">{tag.id}</Badge>
      </span>
    ),
    leaf: true,
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-1">
        <Tree rootLabel="Tags" rootId="root-tags" nodes={tree} />
      </div>
    </ScrollArea>
  );
}