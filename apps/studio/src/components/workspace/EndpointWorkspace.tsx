"use client";

import * as React from "react";

import { useWorkspaceStore } from "./store/workspaceStore";
import { EndpointHeader } from "./EndpointHeader";
import { RequestSection } from "./RequestSection";
import { ResponseSection } from "./ResponseSection";
import type { Operation } from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Workspace page                                                      */
/* ------------------------------------------------------------------ */

/**
 * The full endpoint workspace page.
 *
 * <p>Single-screen layout:</p>
 *
 * <pre>
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ EndpointHeader  (method · server · URL · actions)                   │
 *   ├──────────────────────────────────┬──────────────────────────────────┤
 *   │ Request  (left half)             │ Response  (right half)           │
 *   │   params / headers / query /     │   documentation / runtime        │
 *   │   authorization / cookies / body │   status · body · headers · …   │
 *   └──────────────────────────────────┴──────────────────────────────────┘
 * </pre>
 *
 * <p>Both halves scroll independently. The Request and Response
 * columns share a thin vertical divider; their internal
 * {@link CollapsibleSection}s no longer need the bottom border that
 * was needed for the stacked variant.</p>
 */
export function EndpointWorkspace({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-bg-base"
    >
      <EndpointHeader operation={operation} />

      <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-border overflow-hidden md:grid-cols-2 md:divide-x md:divide-y-0">
        <RequestPanel tabId={tabId} operation={operation} />
        <ResponsePanel tabId={tabId} operation={operation} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Split panels                                                        */
/* ------------------------------------------------------------------ */

function RequestPanel({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const setScrollY = useWorkspaceStore((s) => s.setScrollY);
  const storedScrollY = useWorkspaceStore((s) => s.ui[tabId]?.scrollY ?? 0);

  // Restore scroll position when the tab is mounted.
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: storedScrollY, behavior: "auto" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId]);

  return (
    <div
      ref={scrollerRef}
      onScroll={(event) =>
        setScrollY(tabId, (event.target as HTMLDivElement).scrollTop)
      }
      className="min-h-0 overflow-y-auto"
    >
      <RequestSection tabId={tabId} operation={operation} />
    </div>
  );
}

function ResponsePanel({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  return (
    <div className="min-h-0 overflow-y-auto">
      <ResponseSection tabId={tabId} operation={operation} />
    </div>
  );
}