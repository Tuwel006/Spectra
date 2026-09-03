"use client";

import * as React from "react";
import type { Operation, HttpMethod } from "@spectra/core";

import { ScrollArea } from "@/components/ui/scroll-area";

import {
  initializeDraftFromOperation,
  useDraft,
  useRequestMounted,
  useRequestDraftStore,
} from "./request.store";

import { RequestHeader } from "./RequestHeader";
import { RequestTabs, type RequestTabId } from "./RequestTabs";
import { RequestOverview } from "./RequestOverview";
import { RequestBody } from "./RequestBody";
import { AuthorizationPanel } from "./AuthorizationPanel";
import { PathParamsTable } from "./PathParamsTable";
import { QueryParamsTable } from "./QueryParamsTable";
import { HeadersTable } from "./HeadersTable";
import { CookiesTable } from "./CookiesTable";
import { ExamplesPanel } from "./ExamplesPanel";
import { ResponseViewer } from "@/components/response";

import {
  collectParamHints,
  emptyDraft,
} from "./request.types";
import { supportsRequestBody } from "./httpBodyRules";

/**
 * Root component of the request editor.
 *
 * <p>
 *   Owns the active sub-tab and the URL/method inputs that are local
 *   to the editor (not persisted). Ensures a draft exists in the
 *   request store and renders the sub-panel that matches the active
 *   tab. Send is intentionally not wired — Phase 5 ships UI only.
 * </p>
 *
 * <p>When the user toggles the HTTP method to one that REST convention
 * says can't carry a body (GET / HEAD / OPTIONS), the active tab
 * falls back to "overview" so the panel never renders inside a hidden
 * slot.</p>
 */
export function RequestEditor({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const mounted = useRequestMounted();
  const endpointId = operation.id;

  // Seed a draft the first time this endpoint is opened. Idempotent —
  // `initializeDraftFromOperation` short-circuits if a draft exists.
  React.useEffect(() => {
    if (!mounted) return;
    initializeDraftFromOperation(endpointId, operation);
  }, [mounted, endpointId, operation]);

  const draft = useDraft(mounted ? endpointId : undefined) ?? emptyDraft();

  const [tab, setTab] = React.useState<RequestTabId>("overview");
  const [method, setMethod] = React.useState<HttpMethod>(operation.method);
  const ensureDraft = useRequestDraftStore((s) => s.ensureDraft);

  // Make sure the draft exists for SSR-safe first paint as well.
  React.useEffect(() => {
    ensureDraft(endpointId);
  }, [ensureDraft, endpointId]);

  // Whenever the method changes such that the current tab no longer
  // makes sense, fall back to a safe neighbour. Today the only rule
  // is: if the body tab is open and the new method is body-less,
  // jump back to "overview".
  React.useEffect(() => {
    if (tab === "body" && !supportsRequestBody(method)) {
      setTab("overview");
    }
  }, [method, tab]);

  const hint = React.useMemo(() => collectParamHints(operation), [operation]);
  const enabledHeaders = draft.headers.filter((h) => h.enabled).length;
  const enabledQuery = draft.queryParams.filter((p) => p.enabled).length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-bg-base">
      <RequestHeader
        operation={operation}
        endpointId={endpointId}
        method={method}
        onMethodChange={setMethod}
      />

      <div className="flex items-center justify-between border-b border-border bg-bg-base px-3 py-1">
        <RequestTabs
          value={tab}
          onChange={setTab}
          method={method}
          counts={{
            path: draft.pathParams.length,
            query: enabledQuery,
            headers: enabledHeaders,
            cookies: draft.cookies.length,
          }}
        />
        <span className="hidden text-[10px] uppercase tracking-wider text-text-muted md:inline">
          {hint.produces[0] ? `Accept: ${hint.produces[0]}` : "No Accept header"}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "response" ? (
          <ResponseViewer operation={operation} />
        ) : (
          <ScrollArea className="h-full" orientation="vertical">
            {tab === "overview" ? <RequestOverview operation={operation} /> : null}
            {tab === "auth" ? <AuthorizationPanel endpointId={endpointId} /> : null}
            {tab === "path" ? <PathParamsTable endpointId={endpointId} /> : null}
            {tab === "query" ? <QueryParamsTable endpointId={endpointId} /> : null}
            {tab === "headers" ? <HeadersTable endpointId={endpointId} /> : null}
            {tab === "cookies" ? <CookiesTable endpointId={endpointId} /> : null}
            {tab === "body" && supportsRequestBody(method) ? (
              <RequestBody endpointId={endpointId} />
            ) : null}
            {tab === "examples" ? <ExamplesPanel operation={operation} /> : null}
          </ScrollArea>
        )}
      </div>
    </div>
  );
}