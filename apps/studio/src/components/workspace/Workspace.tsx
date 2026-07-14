"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

import { EndpointTabs } from "./tabs/EndpointTabs";
import { useEndpointTabs, useHasMounted } from "./workspace.store";
import { WorkspaceContent } from "./WorkspaceContent";
import { WorkspaceEmpty } from "./WorkspaceEmpty";
import { WorkspaceHeader } from "./WorkspaceHeader";

/**
 * Top-level workspace. Composes:
 *   • {@link WorkspaceHeader}   toolbar (sidebar toggles, AI assistant)
 *   • {@link EndpointTabs}      chrome-style tab strip
 *   • {@link WorkspaceEmpty}    when no tabs are open
 *   • {@link WorkspaceContent}  when at least one tab is active
 *
 * Mount-flag pattern: the tab strip and content are gated on
 * `useHasMounted()` so SSR and the very first client paint stay
 * identical. After hydration the real store value (with any persisted
 * tabs) is read and rendered.
 */
export function Workspace({ className }: {
  className?: string;
}): React.ReactElement {
  const mounted = useHasMounted();
  const tabs = useEndpointTabs((s) => s.tabs);
  const hasTabs = mounted && tabs.length > 0;

  return (
    <section
      className={cn(
        "flex h-full flex-col overflow-hidden bg-bg-base",
        className,
      )}
      aria-label="Workspace"
    >
      <WorkspaceHeader />

      {/* Mounted-only chrome — keeps SSR markup identical to first
          client render. */}
      {mounted && tabs.length > 0 ? <EndpointTabs /> : null}

      <div className="flex-1 overflow-hidden">
        {hasTabs ? <WorkspaceContent /> : <WorkspaceEmpty />}
      </div>
    </section>
  );
}
