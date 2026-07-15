"use client";

import * as React from "react";

import { useResolvedWorkspaceTab } from "./hooks/useWorkspace";
import { EndpointWorkspace } from "./EndpointWorkspace";
import { useHasMounted } from "./store/workspaceStore";

/**
 * Body of the workspace when at least one tab is open.
 *
 * <p>Rendering strategy:</p>
 *   • Endpoint tabs get the full {@link EndpointWorkspace} page —
 *     collapsible Documentation / Request / Response sections.
 *   • Other resource types (`schema`, `response`, …) get their own
 *     resolver branches in a later phase.
 *
 * Phase 2 ships the endpoint workspace; non-endpoint resources land
 * with the next phase, by design.
 */
export function WorkspaceContent(): React.ReactElement {
  const mounted = useHasMounted();
  const { tab, operation, isReady } = useResolvedWorkspaceTab(mounted);

  // First paint before mount — render a static skeleton so SSR and the
  // first client render stay byte-identical.
  if (!isReady || !tab || !operation) {
    return <EndpointWorkspaceSkeleton />;
  }

  return <EndpointWorkspace tabId={tab.id} operation={operation} />;
}

/**
 * Static skeleton used during SSR and before the client hydrates.
 * Mirrors the endpoint workspace shape so the first paint matches.
 */
function EndpointWorkspaceSkeleton(): React.ReactElement {
  return (
    <div
      className="flex h-full w-full flex-col gap-4 overflow-hidden bg-bg-base"
      aria-hidden="true"
    >
      <div className="flex flex-col gap-3 border-b border-border bg-bg-subtle px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-12 rounded bg-bg-muted" />
          <div className="h-4 w-64 rounded bg-bg-muted" />
        </div>
        <div className="h-3 w-3/4 rounded bg-bg-muted" />
        <div className="h-3 w-2/3 rounded bg-bg-muted" />
      </div>
      <div className="h-9 border-b border-border bg-bg-muted" />
      <div className="h-9 border-b border-border bg-bg-muted" />
      <div className="h-9 border-b border-border bg-bg-muted" />
      <div className="flex-1" />
    </div>
  );
}