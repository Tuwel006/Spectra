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
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { mockDocumentation } from "@/mock/documentation";
import type { HttpMethod, Operation } from "@spectra/core";

import { EnvironmentSelector } from "@/components/request/EnvironmentSelector";
import { useWorkspace } from "./hooks/useWorkspace";
import { readOperationTagsAndAuth } from "./EndpointOverview";

/* ------------------------------------------------------------------ */
/* URL resolution                                                      */
/* ------------------------------------------------------------------ */

/**
 * Look up the path URL for a given operation. The mock documentation
 * stores `Path.url` separately from `Operation` — we walk every path
 * once and cache the result so subsequent lookups are O(1).
 */
const opUrlCache = new Map<string, string>();
function resolveOperationUrl(opId: string): string {
  const cached = opUrlCache.get(opId);
  if (cached) return cached;
  for (const path of Object.values(mockDocumentation.paths)) {
    for (const op of Object.values(path.operations)) {
      if (op?.id === opId) {
        opUrlCache.set(opId, path.url);
        return path.url;
      }
    }
  }
  opUrlCache.set(opId, "");
  return "";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

/**
 * The endpoint header sits at the top of the workspace page. It exposes
 * everything the spec calls for:
 *
 *   • Method badge + URL row (with Copy + Run placeholders)
 *   • Servers dropdown
 *   • Pin / Share actions
 *   • Summary, description, tags, authentication, operationId
 *   • Deprecated badge
 *
 * All data is pulled from the resolved `Operation`. The Pin button
 * toggles the tab's `pinned` flag in the workspace store.
 */
export function EndpointHeader({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const url = resolveOperationUrl(operation.id);
  const { activeTab, togglePin } = useWorkspace();
  const isPinned = activeTab?.pinned ?? false;

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
    <div className="flex flex-col gap-4 border-b border-border bg-bg-subtle px-6 py-5">
      {/* Row 1: method + URL + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge
          method={method as Parameters<typeof MethodBadge>[0]["method"]}
          size="md"
        />
        <h1 className="break-all font-mono text-base font-semibold text-text-primary">
          {url}
        </h1>
        {meta.deprecated ? (
          <Badge tone="warning" size="md" className="gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Deprecated
          </Badge>
        ) : null}
      </div>

      {/* Row 2: actions — server picker, copy, run, pin, share */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          size="sm"
          className="w-44"
          defaultValue={serverOptions[0]?.value}
          options={serverOptions}
          aria-label="Server"
          leadingIcon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
        />
        <EnvironmentSelector />

        <div className="ml-auto flex items-center gap-1.5">
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

          <Tooltip content="Send request — execution lands in a later phase.">
            <Button
              variant="primary"
              size="sm"
              disabled
              leadingIcon={<Send className="h-3.5 w-3.5" />}
              aria-label="Send request"
              className="h-7"
            >
              Run
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Row 3: summary / description / metadata */}
      {operation.summary ? (
        <p className="text-sm font-medium leading-relaxed text-text-primary">
          {operation.summary}
        </p>
      ) : null}
      {operation.description ? (
        <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
          {operation.description}
        </p>
      ) : null}

      {/* Row 4: meta grid (tags / auth / operationId / servers) */}
      <dl className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {operation.operationId ? (
          <MetaField label="Operation ID">
            <code className="font-mono text-xs text-text-primary">
              {operation.operationId}
            </code>
          </MetaField>
        ) : null}

        {meta.tags.length > 0 ? (
          <MetaField label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <Badge key={tag} tone="accent" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </MetaField>
        ) : null}

        <MetaField label="Authentication">
          {meta.security === "BearerAuth" ? (
            <Badge tone="info" size="sm">
              Bearer JWT
            </Badge>
          ) : meta.security === "None" ? (
            <span className="text-xs text-text-muted">
              No authentication required
            </span>
          ) : (
            <span className="text-xs text-text-muted">Not specified</span>
          )}
        </MetaField>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
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

// Re-export so the workspace can pass the right HttpMethod narrowed
// type into MethodBadge without duplicating the union.
export type { HttpMethod };