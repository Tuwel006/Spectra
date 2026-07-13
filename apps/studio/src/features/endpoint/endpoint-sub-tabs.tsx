"use client";

import { ScrollArea, Segmented } from "@/components/ui";
import type { ReactNode } from "react";
import type { EndpointTabId } from "@/constants/explorer";

interface EndpointSubTabsProps {
  readonly tabId: string;
  readonly activeTab: EndpointTabId;
  readonly onTabChange: (tab: EndpointTabId) => void;
  readonly options: ReadonlyArray<{ id: EndpointTabId; label: string }>;
  readonly children: (activeTab: EndpointTabId) => ReactNode;
}

/**
 * Sub-tab strip inside the endpoint viewer.
 *
 * Renders the segmented control plus the active tab's body via a
 * render-prop (`children`) so the parent controls the data lookup.
 */
export function EndpointSubTabs({
  activeTab,
  onTabChange,
  options,
  children,
}: EndpointSubTabsProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center border-b border-border bg-bg-subtle px-3 py-2">
        <Segmented
          value={activeTab}
          onChange={onTabChange}
          options={options}
          size="sm"
        />
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">{children(activeTab)}</div>
      </ScrollArea>
    </div>
  );
}