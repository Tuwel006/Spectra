"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs } from "@/components/ui/tabs";
import {
  Code2,
  Cookie,
  FileText,
  KeyRound,
  ListTree,
  Settings2,
} from "lucide-react";

import {
  AuthorizationPanel,
  CookiesTable,
  HeadersTable,
  PathParamsTable,
  QueryParamsTable,
  RequestBody,
  emptyDraft,
  useDraft,
  useRequestDraftStore,
  useRequestMounted,
  initializeDraftFromOperation,
} from "@/components/request";

import { useWorkspaceStore } from "./store/workspaceStore";
import { CollapsibleSection } from "./CollapsibleSection";
import type { Operation } from "@spectra/core";

/**
 * Sub-tab identifiers for the request editor. Matches the spec layout
 * (Params, Query, Headers, Authorization, Cookies, Body).
 */
export type RequestSubTab =
  | "params"
  | "query"
  | "headers"
  | "authorization"
  | "cookies"
  | "body";

const SUB_TAB_ORDER: readonly RequestSubTab[] = [
  "params",
  "query",
  "headers",
  "authorization",
  "cookies",
  "body",
];

const SUB_TAB_LABEL: Record<RequestSubTab, string> = {
  params: "Params",
  query: "Query",
  headers: "Headers",
  authorization: "Authorization",
  cookies: "Cookies",
  body: "Body",
};

const SUB_TAB_ICON: Record<RequestSubTab, React.ReactNode> = {
  params: <Code2 className="h-3 w-3" aria-hidden />,
  query: <ListTree className="h-3 w-3" aria-hidden />,
  headers: <Settings2 className="h-3 w-3" aria-hidden />,
  authorization: <KeyRound className="h-3 w-3" aria-hidden />,
  cookies: <Cookie className="h-3 w-3" aria-hidden />,
  body: <FileText className="h-3 w-3" aria-hidden />,
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

/**
 * The Request section. Hosts the path / query / headers / auth /
 * cookies / body sub-tabs and wires each to the matching table from
 * `@/components/request`. Per-tab sub-tab selection lives in the
 * workspace store so switching tabs doesn't reset the user's place.
 */
export function RequestSection({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  const mounted = useRequestMounted();
  const endpointId = operation.id;

  // Seed a draft the first time the endpoint opens. Idempotent.
  React.useEffect(() => {
    if (!mounted) return;
    initializeDraftFromOperation(endpointId, operation);
  }, [mounted, endpointId, operation]);

  const ensureDraft = useRequestDraftStore((s) => s.ensureDraft);
  React.useEffect(() => {
    ensureDraft(endpointId);
  }, [ensureDraft, endpointId]);

  // Per-tab sub-tab selection.
  const requestTab = useWorkspaceStore(
    (s) => s.ui[tabId]?.requestTab ?? "params",
  );
  const setRequestTab = useWorkspaceStore((s) => s.setRequestTab);

  const sectionExpanded = useWorkspaceStore(
    (s) => s.ui[tabId]?.sections.request ?? true,
  );
  const toggleSection = useWorkspaceStore((s) => s.toggleSection);

  // Counts drive the badges in the sub-tab strip.
  const draft =
    useDraft(mounted ? endpointId : undefined) ?? emptyDraft();
  const enabledHeaders = useShallowVal(
    mounted ? endpointId : undefined,
    (d) => d.headers.filter((h) => h.enabled).length,
  );
  const enabledQuery = useShallowVal(
    mounted ? endpointId : undefined,
    (d) => d.queryParams.filter((p) => p.enabled).length,
  );

  return (
    <CollapsibleSection
      id={`req-${tabId}`}
      title="Request"
      open={sectionExpanded}
      onToggle={() => toggleSection(tabId, "request")}
      toolbar={
        <Tabs
          value={requestTab}
          onChange={(v) => setRequestTab(tabId, v as string)}
          items={SUB_TAB_ORDER.map((id) => ({
            id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-text-muted">{SUB_TAB_ICON[id]}</span>
                {SUB_TAB_LABEL[id]}
                {id === "headers" && enabledHeaders > 0 ? (
                  <span className="rounded bg-accent px-1 text-[9px] font-medium text-accent-fg">
                    {enabledHeaders}
                  </span>
                ) : null}
                {id === "query" && enabledQuery > 0 ? (
                  <span className="rounded bg-accent px-1 text-[9px] font-medium text-accent-fg">
                    {enabledQuery}
                  </span>
                ) : null}
                {id === "cookies" && draft.cookies.length > 0 ? (
                  <span className="rounded bg-accent px-1 text-[9px] font-medium text-accent-fg">
                    {draft.cookies.length}
                  </span>
                ) : null}
              </span>
            ),
          }))}
        />
      }
    >
      <div className="min-h-[200px]">
        <ScrollArea className="h-full max-h-[60vh]" orientation="vertical">
          {requestTab === "params" ? (
            <PathParamsTable endpointId={endpointId} />
          ) : null}
          {requestTab === "query" ? (
            <QueryParamsTable endpointId={endpointId} />
          ) : null}
          {requestTab === "headers" ? (
            <HeadersTable endpointId={endpointId} />
          ) : null}
          {requestTab === "authorization" ? (
            <AuthorizationPanel endpointId={endpointId} />
          ) : null}
          {requestTab === "cookies" ? (
            <CookiesTable endpointId={endpointId} />
          ) : null}
          {requestTab === "body" ? <RequestBody endpointId={endpointId} /> : null}
        </ScrollArea>
      </div>
    </CollapsibleSection>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Tiny hook that subscribes to a derived count via `useShallow` so
 * the snapshot stays referentially stable across renders.
 */
function useShallowVal(
  endpointId: string | undefined,
  pick: (draft: ReturnType<typeof emptyDraft>) => number,
): number {
  return useRequestDraftStore(
    useShallow((s) => {
      const d = endpointId ? s.drafts[endpointId] : undefined;
      return d ? pick(d) : 0;
    }),
  );
}