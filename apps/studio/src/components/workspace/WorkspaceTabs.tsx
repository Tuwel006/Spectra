"use client";

import * as React from "react";

import { useWorkspace } from "./hooks/useWorkspace";
import { WorkspaceTab } from "./WorkspaceTab";
import type { WorkspaceTab as WorkspaceTabType } from "./types/Workspace";

/**
 * VS Code style tab strip.
 *
 * Renders one {@link WorkspaceTab} per entry in the workspace store
 * and wires keyboard navigation (←/→ to move focus between tabs).
 * Horizontal scrolling kicks in automatically when the row count
 * overflows the strip's width.
 */
export function WorkspaceTabs(): React.ReactElement | null {
  const { tabs, activeTabId, activateTab, closeTab, togglePin } =
    useWorkspace();

  const handleKey = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (tabs.length === 0) return;
      const idx = tabs.findIndex((t) => t.id === activeTabId);
      const next =
        event.key === "ArrowRight"
          ? (idx + 1) % tabs.length
          : (idx - 1 + tabs.length) % tabs.length;
      const target = tabs[next];
      if (target) activateTab(target.id);
    },
    [tabs, activeTabId, activateTab],
  );

  if (tabs.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Open workspace tabs"
      onKeyDown={handleKey}
      className="hover-scrollbar flex h-10 w-full min-w-0 flex-nowrap items-stretch overflow-x-auto overflow-y-hidden border-b border-border bg-bg-muted"
    >
      {tabs.map((tab) => (
        <WorkspaceTab
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          onActivate={(t: WorkspaceTabType) => activateTab(t.id)}
          onClose={closeTab}
          onTogglePin={togglePin}
        />
      ))}
    </div>
  );
}