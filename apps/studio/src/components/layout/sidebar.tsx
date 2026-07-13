"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

import { useLayoutStore } from "@/store/layout-store";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ActivityBar } from "./activity-bar";
import { ExplorerPanel } from "@/components/explorer/explorer-panel";

interface SidebarProps {
  readonly children?: ReactNode;
}

/**
 * Left sidebar — fixed ActivityBar + resizable ExplorerPanel.
 *
 * The whole sidebar collapses to the ActivityBar only via the toggle
 * inside the explorer header.
 */
export function Sidebar(_: SidebarProps) {
  const collapsed = useLayoutStore((state) => state.leftCollapsed);
  const toggle = useLayoutStore((state) => state.toggleLeftSidebar);

  return (
    <div className="flex h-full">
      <ActivityBar />
      {!collapsed ? (
        <div className="flex h-full w-full flex-col border-r border-border bg-bg-base">
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Explorer
            </span>
            <Tooltip content="Collapse sidebar">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label="Collapse sidebar"
                onClick={toggle}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            </Tooltip>
          </div>
          <ExplorerPanel />
        </div>
      ) : null}
    </div>
  );
}