"use client";

import { Layers, Search } from "lucide-react";

import { mockDocumentation } from "@/mock/documentation";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";
import { Tree, type TreeNode } from "@/components/explorer/tree";
import { useUiStore } from "@/store/ui-store";

/**
 * Components explorer view — shows every reusable component declared in
 * the documentation: schemas, parameters, responses, request bodies, etc.
 */
export function ComponentsView() {
  const search = useUiStore((state) => state.explorerSearch).trim().toLowerCase();

  const sections: ReadonlyArray<{ id: string; label: string; entries: readonly string[] }> = [
    {
      id: "schemas",
      label: "Schemas",
      entries: Object.keys(mockDocumentation.components.schemas),
    },
    {
      id: "security",
      label: "Security Schemes",
      entries: Object.keys(mockDocumentation.components.securitySchemes),
    },
  ].filter((section) => section.entries.length > 0);

  const filtered = sections
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) =>
        entry.toLowerCase().includes(search),
      ),
    }))
    .filter((section) => section.entries.length > 0);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Search className="size-4" aria-hidden />}
        title="No components"
        description="No components match the current filter."
      />
    );
  }

  const tree: TreeNode[] = filtered.map((section) => ({
    id: `components-${section.id}`,
    label: (
      <span className="flex items-center gap-1.5">
        <Layers className="size-3 text-text-muted" aria-hidden />
        <span className="truncate">{section.label}</span>
        <Badge variant="subtle">{section.entries.length}</Badge>
      </span>
    ),
    children: section.entries.map((entry) => ({
      id: `component-${section.id}-${entry}`,
      label: (
        <span className="font-mono text-[11px] text-text-secondary">{entry}</span>
      ),
      leaf: true,
    })),
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-1">
        <Tree rootLabel="Components" rootId="root-components" nodes={tree} />
      </div>
    </ScrollArea>
  );
}