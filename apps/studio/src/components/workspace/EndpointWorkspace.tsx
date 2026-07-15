"use client";

import * as React from "react";

import { useWorkspaceStore } from "./store/workspaceStore";
import { EndpointHeader } from "./EndpointHeader";
import { PropertiesDrawer } from "./PropertiesDrawer";
import { RequestSection } from "./RequestSection";
import { ResponseSection } from "./ResponseSection";
import { cn } from "@/lib/cn";
import type { Operation } from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Workspace page                                                      */
/* ------------------------------------------------------------------ */

/**
 * The full endpoint workspace page.
 *
 * <p>Two-column layout:</p>
 *   • Centre column  — endpoint header + Request / Response sections
 *   • Right drawer   — Properties (Info + Properties + Timeline)
 *                       Collapsible so the user can free horizontal
 *                       room when they're editing long bodies.
 *
 * <p>The drawer's open/closed state is persisted per tab in the workspace
 * store, so switching tabs keeps the user's preferred panel layout.
 * The scroll position of the centre column is also persisted.</p>
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

  // Drawer open state — defaulted to open so users see the metadata
  // out of the box. Per-tab so switching endpoints keeps the layout.
  const drawerOpen = useWorkspaceStore(
    (s) => s.ui[tabId]?.drawerOpen ?? true,
  );
  const setDrawerOpen = useWorkspaceStore((s) => s.setDrawerOpen);

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
      className="flex h-full w-full min-w-0 flex-row overflow-hidden bg-bg-base"
    >
      {/* Centre column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scrollerRef}
          onScroll={(event) =>
            setScrollY(tabId, (event.target as HTMLDivElement).scrollTop)
          }
          className="flex-1 overflow-y-auto"
        >
          <EndpointHeader operation={operation} />
          <RequestSection tabId={tabId} operation={operation} />
          <ResponseSection tabId={tabId} operation={operation} />
        </div>
      </div>

      {/* Right drawer */}
      <PropertiesDrawer
        operation={operation}
        open={drawerOpen}
        onToggle={() => setDrawerOpen(tabId, !drawerOpen)}
      />
    </div>
  );
}