"use client";

import { Clock } from "lucide-react";

import { useExplorerStore } from "@/store/explorer-store";
import { mockDocumentation } from "@/mock/documentation";
import { flattenOperations, operationKey } from "@/lib/tree";
import { EmptyState, ScrollArea } from "@/components/ui";
import { EndpointRow } from "@/components/explorer/endpoint-row";

/**
 * Recent explorer view — lists operations the user has opened recently,
 * most recent first.
 */
export function RecentView() {
  const recents = useExplorerStore((state) => state.recents);
  const all = flattenOperations(mockDocumentation.paths);
  const lookup = new Map(all.map((op) => [operationKey(op.pathId, op.method), op]));

  const items = recents
    .map((key) => lookup.get(key))
    .filter((op): op is NonNullable<typeof op> => Boolean(op));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="size-4" aria-hidden />}
        title="Nothing here yet"
        description="Endpoints you open will appear here for quick access."
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