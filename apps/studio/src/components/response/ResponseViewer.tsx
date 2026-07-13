"use client";

import * as React from "react";
import type { Operation } from "@spectra/core";

import { ResponseBody } from "./ResponseBody";
import { ResponseCookies } from "./ResponseCookies";
import { ResponseEmpty } from "./ResponseEmpty";
import { ResponseExamples } from "./ResponseExamples";
import { ResponseHeader } from "./ResponseHeader";
import { ResponseHeaders } from "./ResponseHeaders";
import { ResponseMetadata } from "./ResponseMetadata";
import { ResponseTabs } from "./ResponseTabs";
import { ResponseTimeline } from "./ResponseTimeline";
import { StatusTabs } from "./StatusTabs";
import {
  collectResponseExamples,
  collectResponses,
  type ResponseEntry,
  type ResponseExample,
} from "./response.types";
import {
  useResponseMounted,
  useResponseSlice,
  useResponseViewerStore,
} from "./response.store";

/**
 * Root of the response viewer.
 *
 * <p>
 *   Pulls the documented responses off the {@link Operation}, hosts
 *   the active status + view mode + info tab in the per-endpoint
 *   {@link useResponseViewerStore}, and dispatches to the right
 *   sub-panel.
 * </p>
 *
 * <p>
 *   State is keyed by `endpointId` so the viewer remembers where the
 *   user left off when they tab back to an endpoint.
 * </p>
 */
export function ResponseViewer({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const mounted = useResponseMounted();
  const endpointId = operation.id;

  // Documented responses — computed once per operation.
  const responses = React.useMemo<readonly ResponseEntry[]>(
    () => collectResponses(operation),
    [operation],
  );
  const examples = React.useMemo<readonly ResponseExample[]>(
    () => collectResponseExamples(operation),
    [operation],
  );

  // Default status: first success, otherwise first entry.
  const initialStatus = pickInitialStatus(responses);

  // Slice from the store.
  const slice = useResponseSlice(mounted ? endpointId : undefined);

  // Initialise the selected status lazily.
  const setSelectedStatus = useResponseViewerStore((s) => s.setSelectedStatus);
  React.useEffect(() => {
    if (!mounted) return;
    if (responses.length === 0) return;
    const current = slice.selectedStatus;
    const exists = current !== undefined && responses.some((r) => r.status === current);
    if (!exists) {
      setSelectedStatus(endpointId, initialStatus);
    }
  }, [mounted, endpointId, responses, slice.selectedStatus, initialStatus, setSelectedStatus]);

  // No responses → empty state.
  if (responses.length === 0) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-bg-base">
        <ResponseEmpty />
      </div>
    );
  }

  const selected = pickEntry(responses, slice.selectedStatus) ?? responses[0];
  const viewMode = slice.viewMode;
  const infoTab = slice.infoTab;
  const body = synthesizeBody(selected, examples);
  const raw = stringifyBody(body);
  const filename = `${endpointId}-${selected.status}.json`;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-bg-base"
      id="response-panel"
      role="tabpanel"
      aria-label={`Response for ${endpointId} — status ${selected.status}`}
    >
      <StatusTabs
        responses={responses}
        selected={selected.status}
        onSelect={(status) => setSelectedStatus(endpointId, status)}
      />
      <ResponseHeader entry={selected} />
      <ResponseTabs
        viewMode={viewMode}
        onViewModeChange={(mode) =>
          useResponseViewerStore.getState().setViewMode(endpointId, mode)
        }
        infoTab={infoTab}
        onInfoTabChange={(tab) =>
          useResponseViewerStore.getState().setInfoTab(endpointId, tab)
        }
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <ResponseBody
            entry={selected}
            viewMode={viewMode}
            raw={raw}
            body={body}
            examples={examples}
            search={slice.search}
            onSearchChange={(next) =>
              useResponseViewerStore.getState().setSearch(endpointId, next)
            }
            expandedAll={slice.expandedAll}
            onToggleExpanded={() =>
              useResponseViewerStore
                .getState()
                .setExpandedAll(endpointId, !slice.expandedAll)
            }
            filename={filename}
          />
        </div>

        <aside className="hidden min-h-0 w-[320px] shrink-0 border-l border-border bg-bg-base lg:flex lg:flex-col">
          <InfoPane entry={selected} tab={infoTab} hasHeaders={responses.length > 0} />
        </aside>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Info pane                                                            */
/* ------------------------------------------------------------------ */

function InfoPane({
  entry,
  tab,
  hasHeaders,
}: {
  entry: ResponseEntry;
  tab: import("./response.types").ResponseInfoTab;
  hasHeaders: boolean;
}): React.ReactElement {
  switch (tab) {
    case "headers":
      return <ResponseHeaders entry={entry} />;
    case "cookies":
      return <ResponseCookies hasHeaders={hasHeaders} />;
    case "metadata":
      return <ResponseMetadata entry={entry} />;
    case "timeline":
      return <ResponseTimeline />;
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function pickInitialStatus(responses: readonly ResponseEntry[]): string {
  if (responses.length === 0) return "200";
  const firstSuccess = responses.find((r) => r.numericStatus >= 200 && r.numericStatus < 300);
  return (firstSuccess ?? responses[0]!).status;
}

function pickEntry(
  responses: readonly ResponseEntry[],
  status: string | undefined,
): ResponseEntry | undefined {
  if (!status) return undefined;
  return responses.find((r) => r.status === status);
}

function synthesizeBody(
  entry: ResponseEntry,
  examples: readonly ResponseExample[],
): unknown {
  if (!entry.response.body) return null;
  const match = examples.find((ex) => ex.id.endsWith(`:${entry.status}`));
  if (match) return match.body;
  return null;
}

function stringifyBody(body: unknown): string {
  if (body === undefined) return "";
  if (body === null) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}