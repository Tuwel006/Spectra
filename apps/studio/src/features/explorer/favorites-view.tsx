"use client";

import { Star } from "lucide-react";

import { useExplorerStore } from "@/store/explorer-store";
import { EmptyState, ScrollArea } from "@/components/ui";
import { mockDocumentation } from "@/mock/documentation";
import { operationKey, flattenOperations } from "@/lib/tree";
import { EndpointRow } from "@/components/explorer/endpoint-row";

/**
 * Favorites explorer view — lists operations the user starred.
 *
 * Favourites are stored as operation keys (`pathId:METHOD`); we resolve
 * them back to their full `FlatOperation` here.
 */
export function FavoritesView() {
  const favorites = useExplorerStore((state) => state.favorites);
  const all = flattenOperations(mockDocumentation.paths);
  const lookup = new Map(all.map((op) => [operationKey(op.pathId, op.method), op]));

  const items = favorites
    .map((key) => lookup.get(key))
    .filter((op): op is NonNullable<typeof op> => Boolean(op));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Star className="size-4" aria-hidden />}
        title="No favorites yet"
        description="Click the star next to any endpoint to add it to your favorites."
      />
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-0.5 p-1">
        {items.map((op) => (
          <EndpointRow key={operationKey(op.pathId, op.method)} operation={op} depth={0} />
        ))}
      </div>
    </ScrollArea>
  );
}