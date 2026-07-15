"use client";

import * as React from "react";

import { useWorkspaceStore } from "./store/workspaceStore";
import { EndpointHeader } from "./EndpointHeader";
import { DocumentationSection } from "./DocumentationSection";
import { RequestSection } from "./RequestSection";
import { ResponseSection } from "./ResponseSection";
import type { Operation } from "@spectra/core";

/**
 * The full endpoint workspace page.
 *
 * <p>One continuous page composed of three collapsible sections:</p>
 *   1. Documentation  — summary / description / tags / auth / references
 *   2. Request        — params / query / headers / auth / cookies / body
 *   3. Response       — documentation (existing viewer) / runtime (placeholder)
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

  // Restore scroll position when the tab is mounted. We defer to the
  // next frame so the layout is ready before we move the scroller.
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
      className="flex h-full w-full flex-col overflow-hidden bg-bg-base"
    >
      <div
        ref={scrollerRef}
        onScroll={(event) =>
          setScrollY(tabId, (event.target as HTMLDivElement).scrollTop)
        }
        className="flex-1"
      >
        <EndpointHeader operation={operation} />
        <DocumentationSection
          tabId={tabId}
          operation={operation}
        />
        <RequestSection tabId={tabId} operation={operation} />
        <ResponseSection tabId={tabId} operation={operation} />
      </div>
    </div>
  );
}