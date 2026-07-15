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
  // currently being edited.
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => {
    if (!editing) setDraftUrl(url);
  }, [url, editing]);

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

/**
 * Parse a free-form URL the user typed into the URL bar and write the
 * recoverable bits back into the request draft. We can't always round-
 * trip the path (the user might have replaced `{id}` with something
 * the schema doesn't recognise) so we do best-effort:
 *   • Strip the server base
 *   • Split path / query
 *   • For every `{var}` still in the path template, look for a
 *     matching value in the typed path (segment-by-segment, no fuzzy
 *     matching) and write it back to the draft
 *   • Parse the query string and upsert each pair into the draft
 */
function syncUrlToDraft(
  next: string,
  serverUrl: string,
  path: string,
  endpointId: string,
): void {
  const store = useRequestDraftStore.getState();
  const draft = store.drafts[endpointId];
  if (!draft) return;

  const base = stripTrailingSlash(serverUrl);
  let tail = next.startsWith(base) ? next.slice(base.length) : next;

  const qIndex = tail.indexOf("?");
  let typedPath = tail;
  let typedQuery = "";
  if (qIndex >= 0) {
    typedPath = tail.slice(0, qIndex);
    typedQuery = tail.slice(qIndex + 1);
  }

  // 1. Path params — only update values that match a known token.
  const pathTemplate = path.split("?")[0]!;
  const templateSegs = pathTemplate.split("/").filter(Boolean);
  const typedSegs = typedPath.split("/").filter(Boolean);
  const nextPathParams = [...draft.pathParams];
  for (let i = 0; i < templateSegs.length; i++) {
    const tpl = templateSegs[i]!;
    const m = /^\{([^}]+)\}$/.exec(tpl);
    if (!m) continue;
    const key = m[1]!;
    const value = typedSegs[i] ?? "";
    const idx = nextPathParams.findIndex((r) => r.name === key);
    if (idx >= 0) {
      nextPathParams[idx] = { ...nextPathParams[idx]!, value: decode(value) };
    } else {
      nextPathParams.push({
        id: `pp-${key}`,
        name: key,
        value: decode(value),
        type: "string",
        required: false,
        enabled: true,
      });
    }
  }
  store.patchDraft(endpointId, "pathParams", nextPathParams);

  // 2. Query params — upsert into the existing list.
  const nextQueryParams = [...draft.queryParams];
  if (typedQuery.length > 0) {
    const pairs = typedQuery.split("&");
    for (const pair of pairs) {
      if (!pair) continue;
      const eq = pair.indexOf("=");
      const name = eq >= 0 ? decode(pair.slice(0, eq)) : decode(pair);
      const value = eq >= 0 ? decode(pair.slice(eq + 1)) : "";
      const idx = nextQueryParams.findIndex(
        (r) => r.name === name && r.enabled,
      );
      if (idx >= 0) {
        nextQueryParams[idx] = { ...nextQueryParams[idx]!, value, enabled: true };
      } else {
        nextQueryParams.push({
          id: `qp-${name}`,
          name,
          value,
          type: "string",
          required: false,
          enabled: true,
        });
      }
    }
  }
  store.patchDraft(endpointId, "queryParams", nextQueryParams);
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/* ------------------------------------------------------------------ */
/* Meta field                                                          */
/* ------------------------------------------------------------------ */

function MetaField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}