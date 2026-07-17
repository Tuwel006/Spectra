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
 * <p>One continuous page composed of vertically stacked sections:</p>
 *   1. EndpointHeader  — Method · URL · Send + Server + Copy/Pin/Share
 *   2. Request         — Params / Headers / Query / Cookies / Body
 *   3. Response        — Documentation / Runtime
 *
 * <p>Each section's expand state, scroll position and selected sub-tab
 * are persisted per tab in the workspace store so switching endpoints
 * never loses edits.</p>
 */
export function EndpointWorkspace({
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
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden bg-bg-base"
    >
      <EndpointHeader operation={operation} />

      <div
        ref={scrollerRef}
        onScroll={(event) =>
          setScrollY(tabId, (event.target as HTMLDivElement).scrollTop)
        }
        className="min-h-0 flex-1 overflow-y-auto"
      >
        <RequestSection tabId={tabId} operation={operation} />
        <ResponseSection tabId={tabId} operation={operation} />
      </div>
    </div>
  );
}