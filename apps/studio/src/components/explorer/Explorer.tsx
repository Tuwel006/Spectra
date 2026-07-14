"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerFooter } from "./ExplorerFooter";
import { ExplorerHeader } from "./ExplorerHeader";
import { ExplorerSearch } from "./ExplorerSearch";
import { ExplorerTree } from "./ExplorerTree";
import { useExplorer } from "./hooks/useExplorer";
import { useExplorerSearch } from "./hooks/useExplorerSearch";
import type { ExplorerProps } from "./types/ExplorerState";

/**
 * Sidebar-wide explorer.
 *
 * Renders the full vertical stack: header → search → tree → footer.
 * State lives in two hooks:
 *   • `useExplorer`       — query, expanded sections, folder toggles
 *   • `useExplorerSearch` — applies the live filter to the tree
 *
 * Splitting them keeps the tree component free of search logic and
 * lets future contributors plug in debounced / fuzzy search without
 * touching the surrounding UI.
 */
export function Explorer({
  documentation,
  onEndpointSelect,
  headerActions,
  className,
}: ExplorerProps): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const state = useExplorer(documentation);
  const search = useExplorerSearch(state.tree, state.query);

  // On the very first paint (SSR or hydration) we render a static
  // shell identical to the one before the state hook attaches.
  if (!mounted) {
    return (
      <ExplorerShell className={className}>
        <ExplorerHeader
          title="Explorer"
          subtitle="Studio"
          documentation={documentation}
          actions={headerActions}
        />
        <ExplorerSearch value="" onChange={() => undefined} />
        <div className="flex flex-1 items-center justify-center px-4">
          <ExplorerEmpty />
        </div>
        <ExplorerFooter endpointCount={0} pathCount={0} version={documentation?.metadata?.version} />
      </ExplorerShell>
    );
  }

  return (
    <ExplorerShell className={className}>
      <ExplorerHeader
        title="Explorer"
        subtitle="Studio"
        documentation={state.documentation}
        actions={headerActions}
      />
      <ExplorerSearch
        value={state.query}
        onChange={state.setQuery}
        placeholder="Search APIs…"
      />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" orientation="vertical">
          <ExplorerTree
            tree={search.tree}
            state={state}
            onActivateEndpoint={onEndpointSelect}
          />
        </ScrollArea>
      </div>
      <ExplorerFooter
        endpointCount={search.endpointCount}
        pathCount={state.tree.pathCount}
        version={state.documentation.metadata?.version}
      />
    </ExplorerShell>
  );
}

function ExplorerShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <aside
      className={cn(
        "flex h-full flex-col overflow-hidden bg-bg-subtle text-text-primary",
        "border-r border-border",
        className,
      )}
    >
      {children}
    </aside>
  );
}
