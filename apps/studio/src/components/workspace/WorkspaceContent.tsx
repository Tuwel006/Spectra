"use client";

import * as React from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";

import {
  EndpointHeader,
  readOperationTagsAndAuth,
} from "./EndpointHeader";
import {
  resolveOperation,
  useEndpointTabs,
  useHasMounted,
} from "./workspace.store";
import type { EndpointTabItem } from "./workspace.types";

/**
 * Body of the workspace when at least one tab is open.
 *
 * <p>Rendering strategy:</p>
 *   • Pull the active tab + its resolved `Operation` from the store.
 *   • Pass plain props to {@link EndpointHeader} so the header can stay
 *     free of `@spectra/core` types and rerender cheaply.
 *   • The big request / response area is left as a styled placeholder;
 *     the next phase fills it in.
 */
export function WorkspaceContent(): React.ReactElement {
  const tabs = useEndpointTabs((s) => s.tabs);
  const activeTabId = useEndpointTabs((s) => s.activeTabId);
  const mounted = useHasMounted();

  const tab = mounted ? findActive(tabs, activeTabId) : undefined;
  const op = tab ? resolveOperation(tab.endpointId) : undefined;

  // First paint before mount — render the same static placeholder as
  // SSR to keep hydration identical.
  if (!mounted) {
    return <PlaceholderBody />;
  }

  if (!tab || !op) {
    // Tab metadata is intact but the operation can't be resolved (e.g.
    // stale storage). Render a placeholder body instead of crashing.
    return <PlaceholderBody />;
  }

  const meta = readOperationTagsAndAuth(op);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg-base">
      <EndpointHeader
        tab={tab as EndpointTabItem}
        endpointSummary={op.summary}
        endpointDescription={op.description}
        operationId={op.operationId}
        tags={meta.tags}
        security={meta.security}
        deprecated={meta.deprecated}
      />
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" orientation="vertical">
          <PlaceholderBody />
        </ScrollArea>
      </div>
    </div>
  );
}

function findActive(
  tabs: readonly EndpointTabItem[],
  activeId: string | null,
): EndpointTabItem | undefined {
  if (!activeId) return undefined;
  return tabs.find((t) => t.id === activeId);
}

/**
 * Visible placeholder body. The Phase 5 work — request editor + response
 * viewer — plugs in here. Until then we render a clean <TODO> card so
 * the workspace still has something to scroll.
 */
function PlaceholderBody(): React.ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center px-8">
      <div
        className={cn(
          "flex max-w-md flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-bg-subtle px-6 py-10 text-center",
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Request &amp; Response
        </span>
        <p className="text-sm leading-relaxed text-text-secondary">
          The request editor and response viewer will appear here in the next
          phase. The endpoint metadata above is fully wired to the mock
          documentation.
        </p>
      </div>
    </div>
  );
}
