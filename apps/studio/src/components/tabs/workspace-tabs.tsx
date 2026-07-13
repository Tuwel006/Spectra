"use client";

import { Pin, PinOff, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useTabsStore } from "@/store/tabs-store";
import { MethodBadge } from "@/components/ui";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/**
 * VS Code–style workspace tab strip.
 *
 * Behaviour:
 *  - Click a tab to activate it.
 *  - Click the close icon (or middle-click) to close it.
 *  - Pinned tabs render a pin icon and are protected from `closeOthers`.
 *  - Keyboard: Ctrl/Cmd+W closes the active tab; Ctrl/Cmd+Tab cycles.
 *  - Tabs are scrollable horizontally when many are open.
 */
export function WorkspaceTabs() {
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const setActive = useTabsStore((state) => state.setActive);
  const closeTab = useTabsStore((state) => state.closeTab);
  const togglePin = useTabsStore((state) => state.togglePin);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Ensure the active tab is always scrolled into view.
  useEffect(() => {
    if (!activeTabId || !scrollerRef.current) return;
    const node = scrollerRef.current.querySelector<HTMLElement>(
      `[data-tab-id="${activeTabId}"]`,
    );
    node?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [activeTabId]);

  if (tabs.length === 0) {
    return (
      <div className="flex h-9 shrink-0 items-center border-b border-border bg-bg-subtle px-3 text-xs text-text-muted">
        No endpoints open. Click an endpoint in the Explorer to begin.
      </div>
    );
  }

  return (
    <div
      ref={scrollerRef}
      role="tablist"
      aria-label="Open endpoints"
      className="flex h-9 shrink-0 items-end overflow-x-auto border-b border-border bg-bg-subtle"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            onAuxClick={(event) => {
              if (event.button === 1) {
                event.preventDefault();
                closeTab(tab.id);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(tab.id);
              }
            }}
            onClick={() => setActive(tab.id)}
            className={cn(
              "group relative flex h-8 cursor-pointer items-center gap-2 border-r border-border px-3 text-xs transition-colors",
              active
                ? "bg-bg-base text-text-primary"
                : "bg-bg-subtle text-text-muted hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            {active ? (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden />
            ) : null}

            <MethodBadge method={tab.method} size="xs" />

            <span className="max-w-[180px] truncate font-mono text-[11px]">{tab.url}</span>

            {tab.dirty ? (
              <span
                className="size-1.5 rounded-full bg-status-3xx"
                aria-label="Unsaved changes"
              />
            ) : null}

            <Tooltip content={tab.pinned ? "Unpin tab" : "Pin tab"}>
              <button
                type="button"
                aria-label={tab.pinned ? "Unpin tab" : "Pin tab"}
                aria-pressed={tab.pinned}
                onClick={(event) => {
                  event.stopPropagation();
                  togglePin(tab.id);
                }}
                className={cn(
                  "rounded p-0.5 text-text-muted opacity-0 transition-opacity hover:bg-bg-muted hover:text-text-primary group-hover:opacity-100",
                  tab.pinned && "opacity-100",
                )}
              >
                {tab.pinned ? (
                  <PinOff className="size-3" aria-hidden />
                ) : (
                  <Pin className="size-3" aria-hidden />
                )}
              </button>
            </Tooltip>

            <button
              type="button"
              aria-label="Close tab"
              disabled={tab.pinned}
              onClick={(event) => {
                event.stopPropagation();
                closeTab(tab.id);
              }}
              className={cn(
                "rounded p-0.5 text-text-muted hover:bg-bg-muted hover:text-text-primary",
                tab.pinned && "cursor-not-allowed opacity-30 hover:bg-transparent",
              )}
            >
              <X className="size-3" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}