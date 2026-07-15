"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

import { useWorkspace } from "./hooks/useWorkspace";
import { useHasMounted } from "./store/workspaceStore";
import { WorkspaceContent } from "./WorkspaceContent";
import { WorkspaceEmpty } from "./WorkspaceEmpty";
import { WorkspaceTabs } from "./WorkspaceTabs";

/**
 * Top-level workspace. Composes:
 *   • {@link WorkspaceTabs}     VS Code style tab strip
 *   • {@link WorkspaceEmpty}    welcome screen when no tabs are open
 *   • {@link WorkspaceContent}  endpoint workspace when a tab is active
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
  const { tabs, isEmpty } = useWorkspace();

  return (
    <section
      className={cn(
        "flex h-full min-w-0 max-w-full flex-col overflow-hidden bg-bg-base",
        className,
      )}
      aria-label="Workspace"
    >
      {/* Mounted-only chrome — keeps SSR markup identical to the first
          client render. */}
      {mounted && tabs.length > 0 ? <WorkspaceTabs /> : null}

      <div className="flex-1 overflow-hidden">
        {mounted && !isEmpty ? <WorkspaceContent /> : <WorkspaceEmpty />}
      </div>
    </section>
  );
}