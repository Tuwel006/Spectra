"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerFooter } from "./ExplorerFooter";
import { ExplorerHeader } from "./ExplorerHeader";
import { ExplorerSearch } from "./ExplorerSearch";
import { ExplorerTree } from "./ExplorerTree";
import type { ExplorerProps } from "./Explorer.types";
import {
  DEFAULT_DOCUMENTATION,
  useExplorerState,
} from "./Explorer.utils";
import { useEndpointTabs } from "@/components/workspace/workspace.store";
import { endpointToTab } from "@/components/workspace/workspace.types";

/**
 * Sidebar-wide explorer.
 *
 * Renders the full vertical stack: header → search → tree → footer.
 * All state (search query, expanded sections, selected row) lives in
 * `useExplorerState` so consumers can lift it later via prop callbacks
 * without rewriting the components.
 *
 * Mounting is gated by a `useEffect` to avoid hydration mismatches:
 * the tree on the server reflects the default fold state while the
 * client reads `localStorage`. Same pattern as the application shell.
 */
export function Explorer({
  documentation,
  onEndpointSelect,
  className,
}: ExplorerProps): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const state = useExplorerState(documentation ?? DEFAULT_DOCUMENTATION);
  const openTab = useEndpointTabs((s) => s.openTab);

  const handleActivate = React.useCallback(
    (ep: Parameters<NonNullable<ExplorerProps["onEndpointSelect"]>>[0]) => {
      openTab(endpointToTab(ep));
      onEndpointSelect?.(ep);
    },
    [openTab, onEndpointSelect],
  );

  // On the very first paint (SSR or hydration) we render a static shell
  // identical to the one before the state hook attaches. This avoids the
  // "tree hydrated but some attributes of the server rendered HTML
  // didn't match" warning.
  if (!mounted) {
    return (
      <ExplorerShell className={className}>
        <ExplorerHeader title="Explorer" subtitle="Studio" />
        <ExplorerSearch value="" onChange={() => undefined} />
        <div className="flex flex-1 items-center justify-center px-4">
          <ExplorerEmpty />
        </div>
        <ExplorerFooter endpointCount={0} pathCount={0} />
      </ExplorerShell>
    );
  }

  return (
    <ExplorerShell className={className}>
      <ExplorerHeader title="Explorer" subtitle="Studio" />
      <ExplorerSearch
        value={state.query}
        onChange={state.setQuery}
        placeholder="Search APIs…"
      />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" orientation="vertical">
          <ExplorerTree
            tree={state.tree}
            state={state}
            onActivateEndpoint={handleActivate}
          />
        </ScrollArea>
      </div>
      <ExplorerFooter
        endpointCount={state.tree.endpointCount}
        pathCount={state.tree.pathCount}
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
