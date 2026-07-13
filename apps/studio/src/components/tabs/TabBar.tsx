"use client";

import * as React from "react";
import { X, Plus, Pin } from "lucide-react";
import { cn } from "@/lib/cn";
import { MethodBadge } from "@/components/ui/MethodBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import { useTabStore } from "@/store/tab.store";
import type { Tab } from "@/types";

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
}

/**
 * Single tab item. Supports:
 * - Left-click → activate
 * - Middle-click → close (unless pinned)
 * - Close button (unless pinned)
 * - Pin indicator
 */
function TabItem({ tab, isActive }: TabItemProps) {
  const { setActiveTab, closeTab } = useTabStore();

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle-click closes
    if (e.button === 1) {
      e.preventDefault();
      if (!tab.isPinned) closeTab(tab.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "w" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!tab.isPinned) closeTab(tab.id);
    }
  };

  return (
    <div
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      onClick={() => setActiveTab(tab.id)}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative flex h-9 shrink-0 cursor-pointer select-none items-center gap-2 border-r",
        "border-[--color-border] px-3 text-xs transition-colors",
        "max-w-52 min-w-24",
        isActive
          ? "bg-[--color-bg-base] text-[--color-text-primary] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[--color-accent]"
          : "bg-[--color-bg-subtle] text-[--color-text-muted] hover:bg-[--color-bg-muted] hover:text-[--color-text-secondary]"
      )}
    >
      {tab.isPinned && (
        <Pin className="h-2.5 w-2.5 shrink-0 text-[--color-text-disabled]" />
      )}

      <MethodBadge
        method={tab.endpoint.method}
        compact
        className="shrink-0 text-[9px]"
      />

      <span className="flex-1 truncate font-mono text-[11px]">
        {tab.endpoint.url}
      </span>

      {tab.isDirty && (
        <span className="h-1.5 w-1.5 rounded-full bg-[--color-accent] shrink-0" />
      )}

      {/* Close button — hidden on pinned tabs */}
      {!tab.isPinned && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeTab(tab.id);
          }}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded",
            "text-[--color-text-disabled] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            isActive && "opacity-100"
          )}
          aria-label={`Close tab: ${tab.endpoint.method} ${tab.endpoint.url}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

/**
 * The tab bar — horizontal scrollable list of open tabs.
 * Keyboard: Ctrl+Tab cycles forward, Ctrl+Shift+Tab cycles backward.
 */
export function TabBar() {
  const { tabs, activeTabId } = useTabStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 border-b border-[--color-border] bg-[--color-bg-subtle]">
      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Open endpoints"
        className="flex flex-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
          />
        ))}
      </div>

      {/* New tab placeholder (no-op for now) */}
      <Tooltip content="Open new tab" side="bottom">
        <button
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center",
            "text-[--color-text-muted] hover:bg-[--color-bg-muted]",
            "hover:text-[--color-text-primary] transition-colors border-l border-[--color-border]"
          )}
          aria-label="Open new tab"
        >
          <Plus className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
}
