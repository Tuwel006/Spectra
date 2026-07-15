"use client";

import * as React from "react";
import { Activity, BookOpen, Inbox } from "lucide-react";

import { Tabs } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponseViewer } from "@/components/response";

import type { Operation } from "@spectra/core";

import { useWorkspaceStore } from "./store/workspaceStore";
import { CollapsibleSection } from "./CollapsibleSection";

/**
 * The Response section of an endpoint workspace.
 *
 * Two top-level sub-tabs:
 *   • Documentation — renders the existing {@link ResponseViewer}
 *     (status selector, Example / Schema / Headers tabs, etc.)
 *   • Runtime       — placeholder until the executor lands
 *
 * Selected sub-tab is persisted per workspace tab in the store.
 */
export function ResponseSection({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  const responseTab = useWorkspaceStore(
    (s) => s.ui[tabId]?.responseTab ?? "documentation",
  );
  const setResponseTab = useWorkspaceStore((s) => s.setResponseTab);

  const sectionExpanded = useWorkspaceStore(
    (s) => s.ui[tabId]?.sections.response ?? true,
  );
  const toggleSection = useWorkspaceStore((s) => s.toggleSection);

  return (
    <CollapsibleSection
      id={`resp-${tabId}`}
      title="Response"
      open={sectionExpanded}
      onToggle={() => toggleSection(tabId, "response")}
      toolbar={
        <Tabs
          value={responseTab}
          onChange={(v) => setResponseTab(tabId, v as string)}
          items={[
            {
              id: "documentation",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-text-muted" aria-hidden />
                  Documentation
                </span>
              ),
            },
            {
              id: "runtime",
              label: (
                <span className="inline-flex items-center gap-1.5">
                  <Activity className="h-3 w-3 text-text-muted" aria-hidden />
                  Runtime
                </span>
              ),
            },
          ]}
        />
      }
    >
      <div className="min-h-[300px]">
        {responseTab === "runtime" ? (
          <RuntimePlaceholder />
        ) : (
          <ScrollArea className="h-full max-h-[60vh]" orientation="vertical">
            <ResponseViewer operation={operation} />
          </ScrollArea>
        )}
      </div>
    </CollapsibleSection>
  );
}

/**
 * Empty state shown when the user picks the Runtime sub-tab. The
 * layout pre-warms the future fields (Status / Time / Size / Headers /
 * Cookies / Body / Pretty / Raw / Preview / Timeline) with disabled
 * placeholders so the design language stays consistent once the
 * executor lands.
 */
function RuntimePlaceholder(): React.ReactElement {
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 bg-bg-base px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-border bg-bg-subtle">
        <Inbox className="h-5 w-5 text-text-muted" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-text-primary">
        No request has been executed
      </h3>
      <p className="max-w-md text-xs leading-relaxed text-text-muted">
        The runtime response surface will land in a later phase. The
        fields below are reserved for the executor.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-text-muted">
        {[
          "Status",
          "Time",
          "Size",
          "Headers",
          "Cookies",
          "Body",
          "Pretty",
          "Raw",
          "Preview",
          "Timeline",
        ].map((label) => (
          <span
            key={label}
            className="rounded-sm border border-border bg-bg-subtle px-1.5 py-0.5"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}