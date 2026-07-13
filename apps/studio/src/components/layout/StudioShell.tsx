"use client";

import * as React from "react";
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels";
import { Sparkles, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { TopNav } from "@/components/navigation/TopNav";
import { Explorer } from "@/components/explorer/Explorer";
import { TabBar } from "@/components/tabs/TabBar";
import { EndpointHeader } from "@/components/endpoint/EndpointHeader";
import { EndpointWorkspace } from "@/components/endpoint/EndpointWorkspace";
import { RightSidebar } from "./RightSidebar";
import { StatusBar } from "./StatusBar";
import { EmptyWorkspace } from "./EmptyWorkspace";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTabStore } from "@/store/tab.store";
import { useLayoutStore } from "@/store/layout.store";
import { mockDocumentation } from "@/mock/documentation";

// Sidebar collapse icon button shown in the top-left corner of workspace
function SidebarToggle() {
  const { isLeftSidebarOpen, toggleLeftSidebar } = useLayoutStore();
  const Icon = isLeftSidebarOpen ? PanelLeftClose : PanelLeftOpen;
  return (
    <Tooltip content={isLeftSidebarOpen ? "Close sidebar" : "Open sidebar"} side="bottom">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLeftSidebar}
        aria-label={isLeftSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <Icon className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
}

/**
 * Root Studio shell — orchestrates all panels.
 *
 * Layout (outer → inner):
 *   TopNav
 *   PanelGroup [horizontal]
 *     Left Sidebar  (collapsible)
 *     ResizeHandle
 *     Center Workspace
 *       TabBar
 *       EndpointHeader
 *       EndpointWorkspace   ← resizable horizontal split
 *         [request area]
 *         [response area]   ← future
 *     ResizeHandle
 *     Right Sidebar (collapsible)
 *   StatusBar
 */
export function StudioShell() {
  const { tabs, activeTabId } = useTabStore();
  const {
    isLeftSidebarOpen,
    isRightSidebarOpen,
    toggleRightSidebar,
  } = useLayoutStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[--color-bg-base]">
      {/* ── Top Navigation ── */}
      <TopNav workspaceName={mockDocumentation.info.title} />

      {/* ── Main body ── */}
      <PanelGroup direction="horizontal" className="flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        {isLeftSidebarOpen && (
          <>
            <Panel
              id="left-sidebar"
              order={1}
              defaultSize={18}
              minSize={12}
              maxSize={30}
              className="bg-[--color-bg-subtle] border-r border-[--color-border]"
            >
              <Explorer />
            </Panel>

            <PanelResizeHandle
              className={cn(
                "w-1 bg-transparent hover:bg-[--color-accent] transition-colors duration-150",
                "data-[resize-handle-state=drag]:bg-[--color-accent]"
              )}
              aria-label="Resize sidebar"
            />
          </>
        )}

        {/* ── Center Workspace ── */}
        <Panel id="workspace" order={2} className="flex flex-col overflow-hidden">
          {/* Toolbar row above tabs */}
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[--color-border] px-2 bg-[--color-bg-subtle]">
            <SidebarToggle />

            {/* Spacer */}
            <div className="flex-1" />

            {/* AI Assistant toggle */}
            <Tooltip content="Toggle AI Assistant" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRightSidebar}
                aria-label="Toggle AI Assistant"
                className={cn(isRightSidebarOpen && "text-[--color-accent] bg-[--color-accent-subtle]")}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          {/* Tabs */}
          <TabBar />

          {/* Endpoint content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab ? (
              <>
                <EndpointHeader endpoint={activeTab.endpoint} />
                <div className="flex-1 overflow-hidden">
                  <EndpointWorkspace endpoint={activeTab.endpoint} />
                </div>
              </>
            ) : (
              <EmptyWorkspace />
            )}
          </div>
        </Panel>

        {/* ── Right Sidebar (AI / Analytics) ── */}
        {isRightSidebarOpen && (
          <>
            <PanelResizeHandle
              className={cn(
                "w-1 bg-transparent hover:bg-[--color-accent] transition-colors duration-150",
                "data-[resize-handle-state=drag]:bg-[--color-accent]"
              )}
              aria-label="Resize AI sidebar"
            />
            <Panel
              id="right-sidebar"
              order={3}
              defaultSize={22}
              minSize={15}
              maxSize={35}
              className="overflow-hidden"
            >
              <RightSidebar activeEndpoint={activeTab?.endpoint} />
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* ── Status Bar ── */}
      <StatusBar />
    </div>
  );
}
