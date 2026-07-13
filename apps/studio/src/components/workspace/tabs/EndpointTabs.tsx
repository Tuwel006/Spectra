"use client";

import * as React from "react";

import { useEndpointTabs } from "../workspace.store";
import type { EndpointTabItem } from "../workspace.types";
import { EndpointTab } from "./EndpointTab";

/**
 * Tab strip + outlet wrapper. Renders the chrome-style tabs above the
 * workspace body and isolates per-tab rerenders via `React.memo`.
 *
 * Overflow handling: when more tabs than the strip can show are open
 * the strip gains horizontal scrolling via the parent `<Workspace>`.
 */
function EndpointTabsInner({
  tabs,
  activeTabId,
  onActivate,
  onClose,
  onCloseOthers,
  onDuplicate,
  onTogglePin,
}: {
  tabs: readonly EndpointTabItem[];
  activeTabId: string | null;
  onActivate: (tab: EndpointTabItem) => void;
  onClose: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
}): React.ReactElement {
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
      if (target) onActivate(target);
    },
    [tabs, activeTabId, onActivate],
  );

  return (
    <div
      role="tablist"
      aria-label="Open endpoint tabs"
      onKeyDown={handleKey}
      className="flex h-8 w-full items-stretch overflow-x-auto border-b border-border bg-bg-muted"
    >
      {tabs.map((tab) => (
        <EndpointTab
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          onActivate={onActivate}
          onClose={onClose}
          onCloseOthers={onCloseOthers}
          onDuplicate={onDuplicate}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

/**
 * Store-aware wrapper. Pulls tabs / active id from the workspace store
 * so consumers don't need to subscribe to zustand directly.
 */
export function EndpointTabs({
  onActivate,
  onClose,
  onCloseOthers,
  onDuplicate,
  onTogglePin,
}: {
  onActivate?: (tab: EndpointTabItem) => void;
  onClose?: (id: string) => void;
  onCloseOthers?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onTogglePin?: (id: string) => void;
}): React.ReactElement {
  const tabs = useEndpointTabs((s) => s.tabs);
  const activeTabId = useEndpointTabs((s) => s.activeTabId);
  const closeTab = useEndpointTabs((s) => s.closeTab);
  const closeOthers = useEndpointTabs((s) => s.closeOthers);
  const activateTab = useEndpointTabs((s) => s.activateTab);
  const reorderTab = useEndpointTabs((s) => s.reorderTab);
  const togglePin = useEndpointTabs((s) => s.togglePin);

  return (
    <EndpointTabsInner
      tabs={tabs}
      activeTabId={activeTabId}
      onActivate={(t) => {
        activateTab(t.id);
        onActivate?.(t);
      }}
      onClose={(id) => {
        closeTab(id);
        onClose?.(id);
      }}
      onCloseOthers={(id) => {
        closeOthers(id);
        onCloseOthers?.(id);
      }}
      onDuplicate={(id) => {
        const tab = tabs.find((t) => t.id === id);
        if (!tab) return;
        // Duplicate = open a new tab pointing at the same endpoint. The
        // store dedupes by endpointId, so a second call is a no-op; we
        // still expose the affordance for the future when multiple
        // instances per endpoint are needed.
        const dup: EndpointTabItem = {
          ...tab,
          id: `tab:${tab.endpointId}:copy:${Date.now()}`,
          dirty: true,
        };
        useEndpointTabs.getState().openTab(dup);
        onDuplicate?.(id);
      }}
      onTogglePin={(id) => {
        togglePin(id);
        // Reorder so pinned tabs sit at the left.
        const list = useEndpointTabs.getState().tabs;
        const next = [...list];
        const idx = next.findIndex((t) => t.id === id);
        if (idx >= 0 && next[idx]?.pinned) {
          // Move to the front.
          const [t] = next.splice(idx, 1);
          if (t) reorderTab(t.id, 0);
        }
        onTogglePin?.(id);
      }}
    />
  );
}
