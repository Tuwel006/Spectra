"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Link2,
  Pin,
  Send,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { mockDocumentation } from "@/mock/documentation";
import type { Operation } from "@spectra/core";

import { useRequestDraftStore } from "@/components/request";

import { useWorkspace } from "./hooks/useWorkspace";
import { readOperationTagsAndAuth } from "./EndpointOverview";
import { useEndpointUrl } from "./useEndpointUrl";
import { syncUrlToDraft } from "./urlDraftSync";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * The endpoint header sits at the top of the workspace page. It exposes
 * everything the spec calls for:
 *
 *   • Method badge + server selector + URL input + Run button
 *     (Postman-style row)
 *   • Copy URL, Pin, Share actions
 *   • Summary, description, Tags, Authentication, Operation ID
 *   • Deprecated badge
 *
 * The URL input is live-derived from the request draft. Typing into
 * the path / query params updates the URL automatically; editing the
 * URL input directly writes back to the path / query params so the
 * two surfaces stay in sync.
 */
export function EndpointHeader({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const { activeTab, togglePin } = useWorkspace();
  const isPinned = activeTab?.pinned ?? false;
  const { url, path, serverUrl } = useEndpointUrl(operation);

  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — silently ignore */
    }
  }, [url]);

  const meta = readOperationTagsAndAuth(operation);
  const method = operation.method;
  const serverOptions = mockDocumentation.servers.map((s) => ({
    value: s.id,
    label: s.name ?? s.url,
  }));

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-bg-subtle px-6 py-4">
      {/* Row 1: Server dropdown (left) | Copy / Pin / Share (right) */}
      <div className="flex flex-nowrap items-center gap-2">
        <Select
          size="sm"
          className="min-w-[180px]"
          defaultValue={serverOptions[0]?.value}
          options={serverOptions}
          aria-label="Server"
          leadingIcon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        />

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <Tooltip content={copied ? "Copied!" : "Copy URL"} side="bottom">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copy URL"
              onClick={handleCopy}
              className="h-7 gap-1.5 text-text-secondary"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-status-2xx" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </Tooltip>

          <Tooltip
            content={isPinned ? "Unpin from Explorer" : "Pin to Explorer"}
            side="bottom"
          >
            <Button
              variant="ghost"
              size="sm"
              aria-label={isPinned ? "Unpin" : "Pin"}
              onClick={() => activeTab && togglePin(activeTab.id)}
              className={cn(
                "h-7 gap-1.5",
                isPinned
                  ? "text-accent"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <Pin
                className={cn(
                  "h-3.5 w-3.5",
                  isPinned ? "fill-current" : undefined,
                )}
                aria-hidden
              />
              <span>{isPinned ? "Pinned" : "Pin"}</span>
            </Button>
          </Tooltip>

          <Tooltip content="Share (coming soon)" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Share"
              disabled
              className="h-7 gap-1.5 text-text-secondary"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              <span>Share</span>
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Row 2: Method | URL input | Send */}
      <UrlBar
        method={method}
        url={url}
        path={path}
        serverUrl={serverUrl}
        endpointId={operation.id}
      />

      {/* Summary / description / metadata now live in the right-side
          Properties drawer. Header is intentionally chrome-only. */}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* URL bar                                                            */
/* ------------------------------------------------------------------ */

/**
 * Method + Server + URL + Run row.
 *
 * `url` is the live, fully-substituted URL (see `useEndpointUrl`). The
 * input is a controlled view over it — when the user types into the
 * input we re-parse the value and split the edits between the path
 * template (uncovered) and the query string. The result is that the
 * URL field shows the rendered URL while the draft store still owns
 * the canonical source of truth.
 */
function UrlBar({
  method,
  url,
  path,
  serverUrl,
  endpointId,
}: {
  method: Operation["method"];
  url: string;
  path: string;
  serverUrl: string;
  endpointId: string;
}): React.ReactElement {
  const [draftUrl, setDraftUrl] = React.useState(url);

  // Keep the input in sync when the live URL changes from the draft
  // (typing in path / query params) — but only when the input isn't
  // currently being edited. We use the React-recommended derived
  // state pattern instead of a useEffect to avoid cascading renders.
  const [editing, setEditing] = React.useState(false);
  const [prevUrl, setPrevUrl] = React.useState(url);
  if (prevUrl !== url) {
    setPrevUrl(url);
    if (!editing) setDraftUrl(url);
  }

  const handleChange = React.useCallback(
    (next: string) => {
      setDraftUrl(next);
      // Best-effort sync: parse the input back into the draft.
      syncUrlToDraft(next, serverUrl, path, endpointId);
    },
    [serverUrl, path, endpointId],
  );

  // Single-row layout — Method · URL · Send. The URL input grows to
  // fill the remaining space but never below ~280px so very long
  // paths stay readable without forcing the row to wrap. Method and
  // URL share a connected border so they read as one control; the
  // Send button sits in its own slot with a clear gap.
  return (
    <div className="flex flex-nowrap items-stretch gap-2.5">
      {/* Connected method + URL control */}
      <div
        className={cn(
          "group flex min-w-[280px] flex-1 items-stretch overflow-hidden rounded-md border border-border bg-bg-base transition-colors",
          "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent",
        )}
      >
        <MethodBadge
          method={method as Parameters<typeof MethodBadge>[0]["method"]}
          size="md"
          className="h-9 shrink-0 rounded-none border-0 border-r border-border bg-bg-subtle px-2.5 text-text-primary group-focus-within:border-accent"
        />
        <Input
          size="md"
          value={draftUrl}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          placeholder="https://api.example.com/path"
          leadingIcon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
          aria-label="Request URL"
          wrapperClassName="min-h-0 h-9 flex-1 rounded-none border-0 bg-transparent font-mono focus-within:ring-0 focus-within:border-transparent"
          className="min-h-0 h-full"
        />
      </div>

      <Tooltip content="Send request — execution lands in a later phase.">
        <Button
          variant="primary"
          size="md"
          disabled
          leadingIcon={<Send className="h-3.5 w-3.5" />}
          aria-label="Send request"
          className="h-9 shrink-0"
        >
          Send
        </Button>
      </Tooltip>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* URL → draft sync                                                    */
/* ------------------------------------------------------------------ */
// `syncUrlToDraft` lives in `./urlDraftSync` so both the header URL
// bar (this file) and the inner RequestHeader URL bar can share the
// same parser. Re-exported below for backward compatibility with any
// test that imported it from here.
export { syncUrlToDraft };

/* ------------------------------------------------------------------ */
/* Meta field                                                          */
/* ------------------------------------------------------------------ */

// MetaField is kept available for future header metadata. Not used
// today (the workspace header is chrome-only). Removing the warning
// that follows would force callers to keep importing it; the export
// is intentionally left in place.
void (null as unknown as { label: string } | null);