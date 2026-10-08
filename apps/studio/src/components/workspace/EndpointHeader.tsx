"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Link2,
  Pin,
  Plus,
  RotateCcw,
  Send,
  Share2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MethodBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useDocumentationContext } from "@/lib/documentationContext";
import type { Operation } from "@spectra/core";

import { useWorkspace } from "./hooks/useWorkspace";
import { useEndpointUrl } from "./useEndpointUrl";
import { useUrlStore } from "./urlStore";
import { syncUrlToDraft } from "./urlDraftSync";

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * The endpoint header sits at the top of the workspace page. It exposes
 * everything the spec calls for:
 *
 *   • Server dropdown + "+ Custom URL" toggle (controlled writes to
 *     the URL store; selecting a server updates the URL bar's server
 *     chip in real time).
 *   • Copy URL, Pin, Share actions.
 *   • URL bar split into two visually-distinct segments:
 *       [method] [server base — read-only chip] [path + endpoints —
 *       editable input]
 *   • Send button (disabled — execution lands in a later phase).
 *
 * The URL bar's path/endpoint input is live-derived from the request
 * draft, while the server base is derived from the URL store. Editing
 * either surface writes back to the appropriate store so the path-param
 * table, query-param table, and the URL bar itself stay in sync.
 */
export function EndpointHeader({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const { activeTab, togglePin } = useWorkspace();
  const isPinned = activeTab?.pinned ?? false;
  const { url, path, serverUrl, isCustom, serverLabel } = useEndpointUrl(operation);
  const { documentation } = useDocumentationContext();
  const servers = documentation?.servers ?? [];
  // Default server id (used as the documented-server fallback when the
  // URL store hasn't picked one yet). Read OUTSIDE the zustand selector
  // so the selector closure only depends on a stable string.
  const defaultServerId = servers[0]?.id;

  // URL store wiring — controlled inputs write back into the store on
  // every change. We keep the read-side fields memoised via the store
  // selectors here so React can bail out when nothing changed.
  const selectedServerId = useUrlStore(
    (s) => s.selectedServerId ?? defaultServerId,
  );
  const customServerUrl = useUrlStore((s) => s.customServerUrl);
  const setSelectedServer = useUrlStore((s) => s.setSelectedServer);
  const setCustomServerUrl = useUrlStore((s) => s.setCustomServerUrl);
  const resetServer = useUrlStore((s) => s.resetServer);

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

  const serverOptions = servers.map((s) => ({
    value: s.id,
    label: s.name ?? s.url,
  }));

  // Custom URL row — collapsed by default. Clicking "+ Custom" expands
  // an inline editor that writes to `customServerUrl` and overrides
  // the dropdown selection. Initial state mirrors whatever the store
  // already has (e.g. user restored a session with a custom URL set),
  // so opening the page never strands them with a hidden editor.
  const [showCustom, setShowCustom] = React.useState(Boolean(customServerUrl));

  const handleOpenCustom = React.useCallback(() => {
    // If we have no custom URL yet, prefilled it with the current
    // server's URL so the user can edit it inline rather than starting
    // from an empty string. If they save without changing anything the
    // store de-dupes and returns the same state (see urlStore).
    if (!customServerUrl) {
      setCustomServerUrl(serverUrl);
    }
    setShowCustom(true);
  }, [customServerUrl, serverUrl, setCustomServerUrl]);

  const handleResetServer = React.useCallback(() => {
    resetServer();
    setShowCustom(false);
  }, [resetServer]);

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-bg-subtle px-6 py-4">
      {/* Row 1: Server dropdown + "+ Custom URL" (left) | Copy / Pin / Share (right) */}
      <div className="flex flex-nowrap items-center gap-2">
        <Select
          size="sm"
          className="min-w-[180px]"
          value={selectedServerId}
          onChange={(e) => {
            // Picking a docs server also clears any custom override —
            // the dropdown is the "documented" surface, the custom
            // input is the "override" surface, and they don't stack.
            setSelectedServer(e.currentTarget.value);
          }}
          options={serverOptions}
          aria-label="Server"
          leadingIcon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        />

        <Tooltip
          content={
            isCustom && customServerUrl
              ? "Custom URL active — click to edit"
              : "Add a custom base URL"
          }
          side="bottom"
        >
          <Button
            variant={isCustom ? "primary" : "outline"}
            size="sm"
            onClick={handleOpenCustom}
            aria-label="Add custom URL"
            className="h-7 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span>Custom URL</span>
          </Button>
        </Tooltip>

        {isCustom && customServerUrl ? (
          <Badge tone="accent" size="sm" className="font-mono">
            Custom active
          </Badge>
        ) : null}

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

      {/* Row 1b: Custom URL editor — only rendered when the user
          expands it. Writes through to the URL store, so the URL bar's
          server chip updates in real time as the user types. */}
      {showCustom ? (
        <CustomUrlRow
          value={customServerUrl ?? ""}
          onChange={(next) => setCustomServerUrl(next)}
          onReset={handleResetServer}
          onClose={() => setShowCustom(false)}
        />
      ) : null}

      {/* Row 2: Method | Server URL segment | Path + endpoints segment | Send */}
      <UrlBar
        method={operation.method}
        url={url}
        path={path}
        serverUrl={serverUrl}
        serverLabel={serverLabel}
        isCustom={isCustom}
        endpointId={operation.id}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Custom URL editor                                                   */
/* ------------------------------------------------------------------ */

/**
 * Inline editor for the user-typed base URL. Hidden by default; the
 * "+ Custom URL" button above reveals it. A "reset" action clears the
 * custom value (returning to the dropdown-picked server) and an "X"
 * collapses the row without clearing the value — useful for swapping
 * servers quickly without losing the override.
 */
function CustomUrlRow({
  value,
  onChange,
  onReset,
  onClose,
}: {
  value: string;
  onChange: (next: string) => void;
  onReset: () => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-bg-base px-2 py-1.5">
      <Link2 className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Custom
      </span>
      <Input
        size="sm"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="https://my-mock.example.com"
        spellCheck={false}
        autoComplete="off"
        aria-label="Custom base URL"
        className="font-mono"
        wrapperClassName="min-h-0 h-7 flex-1"
      />
      <Tooltip content="Reset to the selected server" side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          aria-label="Reset to selected server"
          className="h-7 w-7 text-text-secondary"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </Tooltip>
      <Tooltip content="Hide editor" side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Hide custom URL editor"
          className="h-7 w-7 text-text-secondary"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </Tooltip>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* URL bar                                                            */
/* ------------------------------------------------------------------ */

/**
 * Method + Server base + Path/endpoints + Send row.
 *
 * Visual split — three segments inside one connected control:
 *   1. **Method** — coloured MethodBadge on the left.
 *   2. **Server base** — read-only-ish chip showing the active
 *      server's URL (or "Custom" pill). Tint differs from the path
 *      segment to signal "this came from the picker, don't type here".
 *   3. **Path + endpoints** — editable `<Input>` holding the
 *      rendered path with `{var}` interpolations and the query
 *      string. Editing this surface pipes through `syncUrlToDraft`
 *      so the path-param table and query-param table stay in sync.
 *
 * The server chip derives from the URL store; the path input derives
 * from the request draft. Joining them is purely cosmetic.
 */
function UrlBar({
  method,
  url,
  path,
  serverUrl,
  serverLabel,
  isCustom,
  endpointId,
}: {
  method: Operation["method"];
  url: string;
  path: string;
  serverUrl: string;
  serverLabel: string;
  isCustom: boolean;
  endpointId: string;
}): React.ReactElement {
  // The path input holds everything AFTER the server base — i.e. the
  // interpolated path template plus `?…` query. Stripping the base
  // here mirrors the same logic `urlDraftSync` uses on the write side,
  // so the input is the inverse projection of the composed URL.
  const base = React.useMemo(
    () => stripTrailingSlash(serverUrl),
    [serverUrl],
  );
  const renderedTail = React.useMemo(() => {
    if (url.startsWith(base)) return url.slice(base.length);
    // Fallback: the composed URL doesn't start with the active base
    // (rare — usually means the draft was hand-edited to a totally
    // different server). Show the full URL in the path segment so the
    // user sees what we'd actually send.
    return url;
  }, [url, base]);

  const [editing, setEditing] = React.useState(false);
  const [draftTail, setDraftTail] = React.useState(renderedTail);
  const [prevTail, setPrevTail] = React.useState(renderedTail);
  // Derived-state pattern: keep the input in sync when the upstream
  // URL changes (typing in path-param table, query-param table, or
  // changing the server via the dropdown), but never while the user
  // is actively editing this field.
  if (prevTail !== renderedTail) {
    setPrevTail(renderedTail);
    if (!editing) setDraftTail(renderedTail);
  }

  const handleChange = React.useCallback(
    (next: string) => {
      setDraftTail(next);
      // Re-compose the full URL and feed it to the shared sync helper
      // so path-param and query-param tables pick up the edits.
      const fullUrl = `${base}${next}`;
      syncUrlToDraft(fullUrl, serverUrl, path, endpointId);
    },
    [base, serverUrl, path, endpointId],
  );

  return (
    <div className="flex flex-nowrap items-stretch gap-2.5">
      {/* Connected method + server + path control */}
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

        {/* Server base — read-only display chip. Distinct background
            so users can immediately see which part of the URL is
            controlled by the picker above. */}
        <div
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 border-r border-border bg-bg-muted px-2.5 font-mono text-xs",
            isCustom ? "text-accent" : "text-text-secondary",
          )}
          title={isCustom ? "Custom base URL" : `Server: ${serverLabel}`}
          aria-label={isCustom ? "Custom base URL" : `Server ${serverLabel}`}
        >
          <Link2 className="h-3 w-3 shrink-0 text-text-muted" aria-hidden />
          <span className="max-w-[260px] truncate">{base}</span>
        </div>

        {/* Path + endpoints — editable. Wrapped in a flex-1 container
            so it grows to fill the row while the server chip stays
            left-anchored at its natural width. */}
        <Input
          size="md"
          value={draftTail}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          placeholder="/path/{id}?query=value"
          aria-label="Request path and endpoints"
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

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/* ------------------------------------------------------------------ */
/* URL → draft sync                                                    */
/* ------------------------------------------------------------------ */
// `syncUrlToDraft` lives in `./urlDraftSync` so both the header URL
// bar (this file) and the inner RequestHeader URL bar can share the
// same parser. Re-exported below for backward compatibility with any
// test that imported it from here.
export { syncUrlToDraft };
