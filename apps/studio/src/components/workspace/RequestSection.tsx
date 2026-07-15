"use client";

import * as React from "react";
import {
  Code2,
  Cookie,
  FileText,
  KeyRound,
  ListTree,
  Settings2,
} from "lucide-react";

import { Tabs } from "@/components/ui/tabs";
import {
  AuthorizationPanel,
  CookiesTable,
  HeadersTable,
  PathParamsTable,
  QueryParamsTable,
  RequestBody,
  emptyDraft,
  initializeDraftFromOperation,
  useDraft,
  useRequestDraftStore,
  useRequestMounted,
} from "@/components/request";

import { useWorkspaceStore } from "./store/workspaceStore";
import { CollapsibleSection } from "./CollapsibleSection";
import type { Operation } from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Tab definitions                                                     */
/* ------------------------------------------------------------------ */

export type RequestSubTab =
  | "params"
  | "headers"
  | "query"
  | "cookies"
  | "authorization"
  | "body";

const SUB_TAB_ORDER: readonly RequestSubTab[] = [
  "params",
  "headers",
  "query",
  "cookies",
  "authorization",
  "body",
];

const SUB_TAB_LABEL: Record<RequestSubTab, string> = {
  params: "Params",
  headers: "Headers",
  query: "Query",
  cookies: "Cookies",
  authorization: "Authorization",
  body: "Body",
};

const SUB_TAB_ICON: Record<RequestSubTab, React.ReactNode> = {
  params: <Code2 className="h-3.5 w-3.5" />,
  headers: <Settings2 className="h-3.5 w-3.5" />,
  query: <ListTree className="h-3.5 w-3.5" />,
  cookies: <Cookie className="h-3.5 w-3.5" />,
  authorization: <KeyRound className="h-3.5 w-3.5" />,
  body: <FileText className="h-3.5 w-3.5" />,
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

/**
 * The Request section. Hosts the path / headers / query / cookies /
 * authorization / body sub-tabs and wires each to the matching table
 * from `@/components/request`. Per-tab sub-tab selection lives in
 * the workspace store so switching tabs doesn't reset the user's
 * place — matches the {@link ResponseSection} tab pattern.
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

  return (
    <CollapsibleSection
      id={`req-${tabId}`}
      title="Request"
      open={sectionExpanded}
      onToggle={() => toggleSection(tabId, "request")}
    >
      {/* Tab strip — sits at the top of the section body, mirrors
          the Response section's tab UX. */}
      <div className="flex items-center border-b border-border bg-bg-base px-2">
        <Tabs
          value={requestTab}
          onChange={(id) => setRequestTab(tabId, id as string)}
          items={SUB_TAB_ORDER.map((id) => ({
            id,
            label: (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-text-muted">{SUB_TAB_ICON[id]}</span>
                {SUB_TAB_LABEL[id]}
              </span>
            ),
          }))}
        />
      </div>

      <div className="min-h-[200px]">
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
        {requestTab === "body" ? (
          <RequestBody endpointId={endpointId} operation={operation} />
        ) : null}
      </div>
    </CollapsibleSection>
  );
}