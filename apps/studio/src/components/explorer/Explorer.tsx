"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocumentationContext } from "@/lib/documentationContext";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerFooter } from "./ExplorerFooter";
import { ExplorerHeader } from "./ExplorerHeader";
import { ExplorerSearch } from "./ExplorerSearch";
import { ExplorerTree } from "./ExplorerTree";
import { useExplorer } from "./hooks/useExplorer";
import { useExplorerSearch } from "./hooks/useExplorerSearch";
import type { ExplorerEndpoint } from "./types/ExplorerNode";
import type { ExplorerProps } from "./types/ExplorerState";

/**
 * Sidebar-wide explorer.
 *
 * Renders the full vertical stack: header → search → tree → footer.
 * State lives in two hooks:
 *   • `useExplorer`       — query, expanded sections, folder toggles
 *   • `useExplorerSearch` — applies the live filter to the tree
 *
 * <p><strong>Loading-state architecture.</strong> The active
 * documentation arrives asynchronously from <code>document.bin</code>.
 * While it is still loading we cannot call <code>useExplorer</code>
 * (it requires a real <code>Documentation</code>), so we render a
 * static shell instead. To stay inside the Rules of Hooks the
 * hookful component is split out into {@link ExplorerContent} and
 * mounted/unmounted by a single conditional render — the hook count
 * of <code>ExplorerContent</code> never changes between its own
 * renders.</p>
 */
export function Explorer({
  documentation: documentationProp,
  onEndpointSelect,
  headerActions,
  className,
}: ExplorerProps): React.ReactElement {
  // Fall back to the active documentation from context when the host
  // doesn't pass one (the typical case in production — only tests
  // supply an explicit `documentation` override).
  const { documentation: contextDoc } = useDocumentationContext();
  const documentation = documentationProp ?? contextDoc;

  // Single conditional render — once ExplorerContent mounts, its
  // hook count is stable across re-renders.
  if (!documentation) {
    return (
      <ExplorerShell className={className}>
        <ExplorerHeader title="APIs" endpointCount={0} actions={headerActions} />
        <ExplorerSearch value="" onChange={() => undefined} />
        <div className="flex flex-1 items-center justify-center px-4">
          <ExplorerEmpty />
        </div>
        <ExplorerFooter endpointCount={0} pathCount={0} />
      </ExplorerShell>
    );
  }

  return (
    <ExplorerContent
      documentation={documentation}
      onEndpointSelect={onEndpointSelect}
      headerActions={headerActions}
      className={className}
    />
  );
}

/**
 * Inner explorer — assumes `documentation` is defined. Always calls
 * the same hooks in the same order, so the Rules of Hooks hold even
 * when the parent's `documentation` flips between undefined and a
 * real value (which would otherwise throw React error #310).
 */
function ExplorerContent({
  documentation,
  onEndpointSelect,
  headerActions,
  className,
}: Required<Pick<ExplorerProps, "documentation">> &
  Omit<ExplorerProps, "documentation">): React.ReactElement {
  const state = useExplorer(documentation);
  const search = useExplorerSearch(state.tree, state.query);

  // When the user activates an endpoint row we want both the parent
  // (`onEndpointSelect`, e.g. to switch the workspace tab) AND the
  // explorer's own `selectedId` to update so the row gets the accent
  // highlight. Wrap both into a single handler so callers don't have
  // to remember to do the bookkeeping themselves.
  const handleActivate = React.useCallback(
    (endpoint: ExplorerEndpoint) => {
      state.setSelectedId(endpoint.id);
      onEndpointSelect?.(endpoint);
    },
    [state, onEndpointSelect],
  );

  return (
    <ExplorerShell className={className}>
      <ExplorerHeader
        title="APIs"
        endpointCount={search.endpointCount}
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
            onActivateEndpoint={handleActivate}
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
