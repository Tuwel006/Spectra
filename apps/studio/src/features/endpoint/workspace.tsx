"use client";

import { Fragment } from "react";

import { useTabsStore } from "@/store/tabs-store";
import { EmptyState } from "@/components/ui";
import { ScrollText } from "lucide-react";
import { WorkspaceTabs } from "@/components/tabs/workspace-tabs";
import { WorkspaceShortcuts } from "@/components/tabs/workspace-shortcuts";
import { EndpointViewer } from "./endpoint-viewer";

/**
 * Workspace — the central area showing open endpoint tabs and the
 * currently selected endpoint viewer.
 *
 * Renders nothing-but-tabs when the user has not yet picked an endpoint.
 */
export function Workspace() {
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  return (
    <Fragment>
      <WorkspaceShortcuts />
      <main className="flex h-full flex-col">
        <WorkspaceTabs />
        <div className="flex flex-1 flex-col overflow-hidden">
          {activeTab ? (
            <EndpointViewer tabId={activeTab.id} />
          ) : (
            <EmptyState
              icon={<ScrollText className="size-5" aria-hidden />}
              title="No endpoint selected"
              description="Choose an endpoint from the Explorer, Favorites or Recents to open it here."
              className="flex-1"
            />
          )}
        </div>
      </main>
    </Fragment>
  );
}