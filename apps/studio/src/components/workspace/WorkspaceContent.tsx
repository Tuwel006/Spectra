"use client";

import * as React from "react";

import { RequestEditor } from "@/components/request";

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
 *   • Hand the resolved `Operation` to {@link RequestEditor} for the
 *     big request / response area. Phase 5 ships the editor UI; the
 *     response viewer lands in a later phase.
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
    return <RequestEditorSkeleton />;
  }

  if (!tab || !op) {
    // Tab metadata is intact but the operation can't be resolved (e.g.
    // stale storage). Render a skeleton instead of crashing.
    return <RequestEditorSkeleton />;
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
        <RequestEditor operation={op} />
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
 * Static skeleton used during SSR and before the client hydrates. The
 * shape mirrors {@link RequestEditor} so the first paint matches.
 */
function RequestEditorSkeleton(): React.ReactElement {
  return (
    <div className="flex h-full w-full flex-col bg-bg-base" aria-hidden="true">
      <div className="h-[60px] border-b border-border bg-bg-subtle" />
      <div className="flex h-9 items-center gap-3 border-b border-border px-3">
        <div className="h-2 w-12 rounded bg-bg-muted" />
        <div className="h-2 w-16 rounded bg-bg-muted" />
        <div className="h-2 w-12 rounded bg-bg-muted" />
        <div className="h-2 w-12 rounded bg-bg-muted" />
      </div>
      <div className="flex-1" />
    </div>
  );
}