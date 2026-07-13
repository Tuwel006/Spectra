"use client";

import { useMemo } from "react";

import { Box, Search } from "lucide-react";
import { mockDocumentation } from "@/mock/documentation";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";
import { Tree, type TreeNode } from "@/components/explorer/tree";
import { useUiStore } from "@/store/ui-store";

/**
 * Schemas explorer view — flat list of schemas grouped by module.
 *
 * Clicking a schema does not yet open anything; the workspace will
 * route schema clicks to the Schema tab in the endpoint viewer.
 */
export function SchemasView() {
  const search = useUiStore((state) => state.explorerSearch).trim().toLowerCase();

  const groups = useMemo(() => {
    const schemas = Object.values(mockDocumentation.components.schemas);
    const byModule = new Map<string, typeof schemas>();
    for (const schema of schemas) {
      const module = inferModule(schema.id);
      const bucket = byModule.get(module) ?? [];
      bucket.push(schema);
      byModule.set(module, bucket);
    }
    return Array.from(byModule.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([module, items]) => ({ module, items }));
  }, []);

  const tree: TreeNode[] = groups.map(({ module, items }) => ({
    id: `schemas-${module}`,
    label: (
      <span className="flex items-center gap-1.5">
        <span className="truncate">{module}</span>
        <Badge variant="subtle">{items.length}</Badge>
      </span>
    ),
    children: items
      .filter(
        (schema) =>
          !search ||
          schema.id.toLowerCase().includes(search) ||
          (schema.description?.toLowerCase().includes(search) ?? false),
      )
      .map((schema) => ({
        id: `schema-${schema.id}`,
        label: (
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <Box className="size-3 text-text-muted" aria-hidden />
            {schema.id}
          </span>
        ),
        leaf: true,
      })),
  }));

  if (tree.length === 0) {
    return (
      <EmptyState
        icon={<Search className="size-4" aria-hidden />}
        title="No schemas"
        description="No schemas match the current filter."
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-1">
        <Tree rootLabel="Schemas" rootId="root-schemas" nodes={tree} />
      </div>
    </ScrollArea>
  );
}

/**
 * Naive module inference based on the schema id prefix.
 * Falls back to "Common" when no prefix matches.
 */
function inferModule(id: string): string {
  if (id.startsWith("PageOf")) return "Pagination";
  if (id.startsWith("Create") || id.startsWith("Update")) return "Requests";
  if (id.startsWith("Product") || id.startsWith("Category")) return "Catalog";
  if (id.startsWith("Order") || id.startsWith("Cart") || id.startsWith("Shipment"))
    return "Orders";
  if (id.startsWith("Review") || id.startsWith("Moderation")) return "Reviews";
  if (id.startsWith("Admin") || id.startsWith("Bulk")) return "Administration";
  if (id.startsWith("Auth") || id.startsWith("Login") || id.startsWith("Register"))
    return "Auth";
  if (
    id === "User" ||
    id.startsWith("User") ||
    id === "Address" ||
    id === "Image" ||
    id === "Money"
  )
    return "User";
  return "Common";
}