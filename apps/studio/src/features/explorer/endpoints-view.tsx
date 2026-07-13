"use client";

import { useMemo } from "react";

import { mockDocumentation } from "@/mock/documentation";
import { flattenOperations, operationKey, type FlatOperation } from "@/lib/tree";
import { readTags } from "@/types/extension";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";
import { FolderTree } from "lucide-react";
import { EndpointRow } from "@/components/explorer/endpoint-row";
import { Tree, type TreeNode } from "@/components/explorer/tree";
import { useUiStore } from "@/store/ui-store";

/**
 * Endpoints explorer view — groups operations by tag, falls back to
 * "Untagged" for operations without `x-tags`.
 *
 * Free-text search (driven by the top-bar search input) filters both
 * the URL and the operation name.
 */
export function EndpointsView() {
  const search = useUiStore((state) => state.explorerSearch).trim().toLowerCase();

  const grouped = useMemo(() => groupByTag(mockDocumentation), []);

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={<FolderTree className="size-4" aria-hidden />}
        title="No endpoints"
        description="The mock documentation does not declare any operations."
      />
    );
  }

  const filtered = search
    ? grouped
        .map((group) => ({
          ...group,
          operations: group.operations.filter((op) =>
            matchesSearch(op, search),
          ),
        }))
        .filter((group) => group.operations.length > 0)
    : grouped;

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<FolderTree className="size-4" aria-hidden />}
        title="No matches"
        description={`Nothing matched "${search}".`}
      />
    );
  }

  const tree: TreeNode[] = filtered.map((group) => ({
    id: `tag-${group.tag}`,
    label: (
      <span className="flex items-center gap-1.5">
        <span className="truncate">{group.tag}</span>
        <Badge variant="subtle">{group.operations.length}</Badge>
      </span>
    ),
    children: group.operations.map((op) => ({
      id: operationKey(op.pathId, op.method),
      label: (
        <EndpointRow
          operation={op}
          depth={1}
          tag={group.tag}
        />
      ),
      leaf: true,
    })),
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-1">
        <Tree rootLabel="Endpoints" rootId="root-endpoints" nodes={tree} />
      </div>
    </ScrollArea>
  );
}

interface TagGroup {
  readonly tag: string;
  readonly operations: readonly FlatOperation[];
}

function groupByTag(doc: typeof mockDocumentation): readonly TagGroup[] {
  const map = new Map<string, FlatOperation[]>();
  const all = flattenOperations(doc.paths);

  for (const op of all) {
    const tags = readTags(op.extensions);
    const target = tags[0] ?? "Untagged";
    const bucket = map.get(target) ?? [];
    bucket.push(op);
    map.set(target, bucket);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, operations]) => ({ tag, operations }));
}

function matchesSearch(op: FlatOperation, search: string): boolean {
  return (
    op.pathUrl.toLowerCase().includes(search) ||
    (op.name?.toLowerCase().includes(search) ?? false) ||
    (op.summary?.toLowerCase().includes(search) ?? false) ||
    op.method.toLowerCase().includes(search)
  );
}