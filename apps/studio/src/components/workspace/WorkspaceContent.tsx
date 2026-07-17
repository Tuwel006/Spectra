"use client";

import * as React from "react";

import { useResolvedWorkspaceTab } from "./hooks/useWorkspace";
import { EndpointWorkspace } from "./EndpointWorkspace";
import { useHasMounted, useWorkspaceStore } from "./store/workspaceStore";
import { resolveOperation } from "./store/workspaceStore";
import type { Operation } from "@spectra/core";

/**
 * Body of the workspace when at least one tab is open.
 *
 * <p>Rendering strategy:</p>
 *   • Endpoint tabs get the full {@link EndpointWorkspace} page —
 *     collapsible Documentation / Request / Response sections.
 *   • Other resource types (`schema`, `response`, …) get their own
 *     resolver branches in a later phase.
 *
 * Falls back to the first available endpoint tab if the active tab
 * resolves to nothing, so the workspace body never appears empty
 * while tabs are open.
 */
export function WorkspaceContent(): React.ReactElement {
  const mounted = useHasMounted();
  const { tab, operation, isReady } = useResolvedWorkspaceTab(mounted);

  // No active tab resolved — fall back to the first available
  // endpoint tab so the body always shows content when tabs exist.
  const fallback = useWorkspaceStore((s) => {
    if (s.activeTabId) return null;
    return s.tabs.find((t) => t.resourceType === "endpoint") ?? s.tabs[0] ?? null;
  });

  const effectiveTab = tab ?? fallback;

  // First paint before mount — render a static skeleton so SSR and the
  // first client render stay byte-identical.
  if (!mounted || !effectiveTab) {
    return <EndpointWorkspaceSkeleton />;
  }

  // Resolve the operation for the effective tab (may be the fallback).
  const resolvedOp: Operation | undefined =
    operation ?? resolveOperation(effectiveTab.resourceId);

  if (!isReady || !resolvedOp) {
    return <EndpointWorkspaceSkeleton />;
  }

  return <EndpointWorkspace tabId={effectiveTab.id} operation={resolvedOp} />;
}

/**
 * Static skeleton used during SSR and before the client hydrates.
 * Mirrors {@link EndpointWorkspace} shape so the first paint matches.
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