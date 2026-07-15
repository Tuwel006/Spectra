"use client";

import * as React from "react";

import { useResolvedWorkspaceTab } from "./hooks/useWorkspace";
import { EndpointOverview } from "./EndpointOverview";
import { useHasMounted } from "./store/workspaceStore";

/**
 * Body of the workspace when at least one tab is open.
 *
 * <p>Rendering strategy:</p>
 *   • Read the active tab + its resolved `Operation` from the store.
 *   • Hand the `Operation` to {@link EndpointOverview} for the read-only
 *     metadata block (method, URL, summary, description, tags, auth,
 *     operationId).
 *   • Other resource types (`schema`, `response`, …) get their own
 *     resolver branches in a later phase.
 *
 * Phase 2 ships the overview only — request / response editors land in
 * a later phase, by design.
 */
export function WorkspaceContent(): React.ReactElement {
  const mounted = useHasMounted();
  const { tab, operation, isReady } = useResolvedWorkspaceTab(mounted);

  // First paint before mount — render a static skeleton so SSR and the
  // first client render stay byte-identical.
  if (!isReady || !tab || !operation) {
    return <EndpointOverviewSkeleton />;
  }

  return (
    <div
      id={`tabpanel-${tab.id}`}
      role="tabpanel"
      aria-labelledby={`tab-${tab.id}`}
      className="flex h-full w-full flex-col overflow-hidden bg-bg-base"
    >
      <EndpointOverview
        method={tab.method ?? operation.method}
        url={tab.url ?? ""}
        operation={operation}
      />
    </div>
  );
}

/**
 * Static skeleton used during SSR and before the client hydrates.
 * Mirrors {@link EndpointOverview} so the first paint matches.
 */
function EndpointOverviewSkeleton(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full flex-col gap-5 overflow-hidden bg-bg-base px-6 py-5"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-12 rounded bg-bg-muted" />
        <div className="h-4 w-64 rounded bg-bg-muted" />
      </div>
      <div className="h-3 w-3/4 rounded bg-bg-muted" />
      <div className="h-3 w-2/3 rounded bg-bg-muted" />
      <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div className="h-8 w-full rounded bg-bg-muted" />
        <div className="h-8 w-full rounded bg-bg-muted" />
        <div className="h-8 w-full rounded bg-bg-muted" />
      </div>
    </div>
  );
}