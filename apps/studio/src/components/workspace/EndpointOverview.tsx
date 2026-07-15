"use client";

import * as React from "react";
import {
  AlertTriangle,
  KeySquare,
  Lock,
  Tag as TagIcon,
} from "lucide-react";

import { Badge, MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { HttpMethod, Operation } from "@spectra/core";

/**
 * Renders the metadata block for an active endpoint tab.
 *
 * <p>Data sources come from:</p>
 *   • The {@link Operation} for `summary`, `description`, `operationId`
 *   • `operation.extensions["x-tags"]` for tag chips
 *   • `operation.extensions["x-security"]` for the auth badge
 *   • The caller for `method` and `url` (the explorer owns the URL)
 *
 * This is the read-only "Endpoint Overview" surface — request/response
 * editors are intentionally out of scope for this phase.
 */
export interface EndpointOverviewProps {
  method: HttpMethod;
  url: string;
  operation: Operation;
  className?: string;
}

export function EndpointOverview({
  method,
  url,
  operation,
  className,
}: EndpointOverviewProps): React.ReactElement {
  const meta = readOperationTagsAndAuth(operation);

  return (
    <div
      className={cn(
        "flex flex-col gap-5 overflow-y-auto bg-bg-base px-6 py-5",
        className,
      )}
    >
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-2.5">
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

      {/* Summary */}
      {operation.summary ? (
        <p className="text-sm font-medium leading-relaxed text-text-primary">
          {operation.summary}
        </p>
      ) : null}

      {/* Description */}
      {operation.description ? (
        <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed text-text-secondary">
          {operation.description}
        </p>
      ) : null}

      {/* Metadata grid */}
      <dl className="grid w-full grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {operation.operationId ? (
          <Field label="Operation ID">
            <code className="font-mono text-xs text-text-primary">
              {operation.operationId}
            </code>
          </Field>
        ) : null}

        {meta.tags.length > 0 ? (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {meta.tags.map((tag) => (
                <Badge key={tag} tone="accent" size="sm" className="gap-1">
                  <TagIcon className="h-3 w-3" aria-hidden="true" />
                  {tag}
                </Badge>
              ))}
            </div>
          </Field>
        ) : null}

        <Field label="Authentication">
          {meta.security === "BearerAuth" ? (
            <Badge tone="info" size="sm" className="gap-1">
              <KeySquare className="h-3 w-3" aria-hidden="true" />
              Bearer JWT
            </Badge>
          ) : meta.security === "None" ? (
            <span className="inline-flex items-center gap-1 text-xs text-text-muted">
              <Lock className="h-3 w-3" aria-hidden="true" />
              No authentication required
            </span>
          ) : (
            <span className="text-xs text-text-muted">Not specified</span>
          )}
        </Field>
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function Field({
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

/**
 * Pull auth + tag data out of an `Operation.extensions` blob.
 *
 * `x-security` accepts `string` (BearerAuth by convention), `null`
 * (explicitly anonymous) or any other value (Unknown — the UI shows a
 * neutral label so users notice missing security metadata).
 */
export function readOperationTagsAndAuth(op: {
  readonly extensions?: Record<string, unknown>;
}): {
  readonly tags: readonly string[];
  readonly security: "BearerAuth" | "None" | "Unknown";
  readonly deprecated: boolean;
} {
  const ext = op.extensions ?? {};
  const rawTags = ext["x-tags"];
  const tags = Array.isArray(rawTags)
    ? rawTags.filter((t): t is string => typeof t === "string")
    : [];
  const sec = ext["x-security"];
  let security: "BearerAuth" | "None" | "Unknown" = "Unknown";
  if (typeof sec === "string" && sec.length > 0) security = "BearerAuth";
  else if (sec === null) security = "None";
  const depExt = ext["x-deprecated"];
  const deprecated =
    depExt === true ||
    (typeof depExt === "object" && depExt !== null) ||
    (typeof ext["deprecated"] === "boolean" && ext["deprecated"] === true);
  return { tags, security, deprecated };
}