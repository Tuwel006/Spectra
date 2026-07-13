"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
} from "lucide-react";
import { useMemo } from "react";

import { ExplorerSection } from "@/constants/explorer";
import { useExplorerStore } from "@/store/explorer-store";
import { useUiStore } from "@/store/ui-store";
import { flattenOperations } from "@/lib/tree";
import { mockDocumentation } from "@/mock/documentation";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { EndpointsView } from "@/features/explorer/endpoints-view";
import { SchemasView } from "@/features/explorer/schemas-view";
import { ComponentsView } from "@/features/explorer/components-view";
import { TagsView } from "@/features/explorer/tags-view";
import { ServersView } from "@/features/explorer/servers-view";
import { FavoritesView } from "@/features/explorer/favorites-view";
import { RecentView } from "@/features/explorer/recent-view";
import { SettingsView } from "@/features/explorer/settings-view";

/**
 * Renders the explorer panel body based on the currently active section.
 *
 * Hosts the Expand/Collapse-All controls in its header strip.
 */
export function ExplorerPanel() {
  const section = useUiStore((state) => state.explorerSection);
  const expandAll = useExplorerStore((state) => state.expandAll);
  const collapseAll = useExplorerStore((state) => state.collapseAll);

  const allIds = useMemo(() => {
    const ids: string[] = [];
    const ops = flattenOperations(mockDocumentation.paths);
    for (const op of ops) {
      ids.push(`tag-${(op.extensions?.["x-tags"] as string[] | undefined)?.[0] ?? "Untagged"}`);
      ids.push(`${op.pathId}:${op.method.toUpperCase()}`);
    }
    ids.push("root-endpoints");
    ids.push("root-schemas");
    ids.push("root-tags");
    ids.push("root-servers");
    ids.push("root-components");
    return ids;
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-7 shrink-0 items-center justify-end gap-0.5 border-b border-border px-1.5">
        <Tooltip content="Expand all">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Expand all"
            onClick={() => expandAll(allIds)}
          >
            <ChevronsUpDown className="size-3.5" />
          </Button>
        </Tooltip>
        <Tooltip content="Collapse all">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Collapse all"
            onClick={collapseAll}
          >
            <ChevronsDownUp className="size-3.5" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-hidden">
        {section === ExplorerSection.Endpoints ? <EndpointsView /> : null}
        {section === ExplorerSection.Schemas ? <SchemasView /> : null}
        {section === ExplorerSection.Components ? <ComponentsView /> : null}
        {section === ExplorerSection.Tags ? <TagsView /> : null}
        {section === ExplorerSection.Servers ? <ServersView /> : null}
        {section === ExplorerSection.Favorites ? <FavoritesView /> : null}
        {section === ExplorerSection.Recent ? <RecentView /> : null}
        {section === ExplorerSection.Settings ? <SettingsView /> : null}
      </div>
    </div>
  );
}