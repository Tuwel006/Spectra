"use client";

import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";

import { TopNav } from "./top-nav";
import { Sidebar } from "./sidebar";
import { RightSidebar } from "./right-sidebar";
import { Workspace } from "@/features/endpoint/workspace";
import { CommandPalette } from "@/features/search/command-palette";
import { ToastViewport } from "@/components/common/toast-viewport";
import { useLayoutStore } from "@/store/layout-store";

/**
 * Application shell.
 *
 * Vertical stack: TopNav → main row → optional bottom console.
 * The main row is a three-column horizontal `PanelGroup`:
 *
 *   [ Sidebar ][ Workspace ][ RightSidebar ]
 *
 * All sizes are percentages so the layout scales from 13" laptops to
 * ultrawide monitors. Panel handles are drag-resizable and their sizes
 * are persisted via the `useLayoutStore` zustand store.
 */
export function AppShell() {
  const leftWidth = useLayoutStore((state) => state.leftSidebarWidth);
  const rightWidth = useLayoutStore((state) => state.rightSidebarWidth);
  const leftCollapsed = useLayoutStore((state) => state.leftCollapsed);
  const rightCollapsed = useLayoutStore((state) => state.rightCollapsed);
  const setLeftWidth = useLayoutStore((state) => state.setLeftSidebarWidth);
  const setRightWidth = useLayoutStore((state) => state.setRightSidebarWidth);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg-base text-text-primary">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" autoSaveId="spectra.main">
          {!leftCollapsed ? (
            <>
              <Panel
                defaultSize={leftWidth}
                minSize={14}
                maxSize={45}
                onResize={setLeftWidth}
                className="flex flex-col"
              >
                <Sidebar />
              </Panel>
              <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-accent/40 data-[resize-handle-state=drag]:bg-accent" />
            </>
          ) : (
            <Panel defaultSize={3.5} minSize={3.5} maxSize={3.5}>
              <Sidebar />
            </Panel>
          )}

          <Panel defaultSize={100 - leftWidth - (rightCollapsed ? 3.5 : rightWidth)} minSize={30}>
            <Workspace />
          </Panel>

          {!rightCollapsed ? (
            <>
              <PanelResizeHandle className="w-px bg-border transition-colors hover:bg-accent/40 data-[resize-handle-state=drag]:bg-accent" />
              <Panel
                defaultSize={rightWidth}
                minSize={18}
                maxSize={45}
                onResize={setRightWidth}
                className="flex flex-col"
              >
                <RightSidebar />
              </Panel>
            </>
          ) : (
            <Panel defaultSize={3.5} minSize={3.5} maxSize={3.5}>
              <RightSidebar />
            </Panel>
          )}
        </PanelGroup>
      </div>
      <CommandPalette />
      <ToastViewport />
    </div>
  );
}