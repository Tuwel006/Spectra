"use client";

import { useMemo } from "react";

import { Globe, Search } from "lucide-react";
import { mockDocumentation } from "@/mock/documentation";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";
import { Tree, type TreeNode } from "@/components/explorer/tree";
import { useUiStore } from "@/store/ui-store";

/**
 * Servers explorer view — surfaces every server declared in the
 * documentation together with its variables.
 */
export function ServersView() {
  const search = useUiStore((state) => state.explorerSearch).trim().toLowerCase();

  const servers = useMemo(
    () =>
      mockDocumentation.servers.filter(
        (server) =>
          !search ||
          server.url.toLowerCase().includes(search) ||
          (server.description?.toLowerCase().includes(search) ?? false) ||
          (server.name?.toLowerCase().includes(search) ?? false),
      ),
    [search],
  );

  if (servers.length === 0) {
    return (
      <EmptyState
        icon={<Search className="size-4" aria-hidden />}
        title="No servers"
        description="No servers match the current filter."
      />
    );
  }

  const tree: TreeNode[] = servers.map((server) => ({
    id: `server-${server.id}`,
    label: (
      <span className="flex items-center gap-1.5">
        <Globe className="size-3 text-text-muted" aria-hidden />
        <span className="truncate">{server.name ?? server.url}</span>
      </span>
    ),
    children: [
      {
        id: `server-${server.id}-url`,
        label: (
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-text-muted">URL</span>
            <span className="truncate">{server.url}</span>
          </span>
        ),
        leaf: true,
      },
      ...Object.entries(server.variables ?? {}).map(([key, value]) => ({
        id: `server-${server.id}-var-${key}`,
        label: (
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-text-muted">$</span>
            {key}
            <Badge variant="subtle">{value.default}</Badge>
          </span>
        ),
        leaf: true,
      })),
    ],
  }));

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-1">
        <Tree rootLabel="Servers" rootId="root-servers" nodes={tree} />
      </div>
    </ScrollArea>
  );
}