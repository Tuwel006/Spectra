"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { ChevronDown, ChevronRight } from "lucide-react";

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
import { cn } from "@/lib/cn";
import type { Operation } from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

/**
 * The Request section. Renders the request side of the endpoint as a
 * single collapsible section whose body is a vertical stack of
 * parameter sub-sections — Params, Headers, Query, Cookies, Body, and
 * Authorization — each rendered one after another like the screenshot.
 *
 * Each sub-section has its own expand/collapse toggle. Per-section
 * state lives locally so toggling one row doesn't ripple to the rest.
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
      <div className="flex flex-col divide-y divide-border">
        <ParamSubSection
          id={`params-${tabId}`}
          title="Params"
          defaultOpen
        >
          <PathParamsTable endpointId={endpointId} />
        </ParamSubSection>

        <ParamSubSection id={`headers-${tabId}`} title="Headers">
          <HeadersTable endpointId={endpointId} />
        </ParamSubSection>

        <ParamSubSection id={`query-${tabId}`} title="Query">
          <QueryParamsTable endpointId={endpointId} />
        </ParamSubSection>

        <ParamSubSection id={`cookies-${tabId}`} title="Cookies">
          <CookiesTable endpointId={endpointId} />
        </ParamSubSection>

        <ParamSubSection id={`auth-${tabId}`} title="Authorization">
          <AuthorizationPanel endpointId={endpointId} />
        </ParamSubSection>

        <ParamSubSection id={`body-${tabId}`} title="Body">
          <RequestBody endpointId={endpointId} operation={operation} />
        </ParamSubSection>
      </div>
    </CollapsibleSection>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-section                                                         */
/* ------------------------------------------------------------------ */

/**
 * One stacked sub-section inside the Request block. Each has its own
 * open/closed toggle so users can collapse the rows they're not
 * editing. Default state is closed except for Params, which is the most
 * common editing target.
 */
function ParamSubSection({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <section className="flex flex-col" aria-labelledby={`${id}-title`}>
      <header
        className={cn(
          "flex h-8 shrink-0 items-center gap-1.5 px-4",
          "bg-bg-base",
        )}
      >
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex items-center gap-1.5",
            "text-[11px] font-semibold uppercase tracking-wider text-text-secondary",
            "transition-colors hover:text-text-primary",
          )}
        >
          {open ? (
            <ChevronDown
              className="h-3 w-3 text-text-muted"
              aria-hidden
            />
          ) : (
            <ChevronRight
              className="h-3 w-3 text-text-muted"
              aria-hidden
            />
          )}
          <span id={`${id}-title`}>{title}</span>
        </button>
      </header>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-title`}
        hidden={!open}
        className={cn("flex flex-col", open ? "" : "h-0")}
      >
        {open ? children : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Re-export for downstream tests / wrappers                           */
/* ------------------------------------------------------------------ */

export { useShallow };