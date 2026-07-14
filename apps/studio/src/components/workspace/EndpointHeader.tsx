import * as React from "react";
import { AlertTriangle, Lock, Tag as TagIcon, KeySquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { EndpointTabItem } from "./workspace.types";

/**
 * Renders the metadata block above the workspace body for a single
 * endpoint tab. Pure presentation — the data has already been resolved
 * by the parent.
 *
 * <p>
 *   Sources come from the underlying {@link Operation}:
 * </p>
 *   • {@link Operation.method}, {@link Operation.url} for the title row
 *   • {@link Operation.summary} for the one-liner under the path
 *   • {@link Operation.description} for the long-form prose
 *   • {@link Operation.operationId} for the developer-facing identifier
 *   • `extensions["x-tags"]` for tag chips
 *   • `extensions["x-security"]` for the auth badge
 *
 * Deprecation detection falls back to `extensions["x-deprecated"]` or
 * the conventional `deprecated: true` flag — the mock doesn't set it,
 * but the surrounding UI is ready when it does.
 */
export function EndpointHeader({
  tab,
  endpointSummary,
  endpointDescription,
  operationId,
  tags,
  security,
  deprecated,
}: {
  tab: EndpointTabItem;
  endpointSummary: string | undefined;
  endpointDescription: string | undefined;
  operationId: string | undefined;
  tags: readonly string[];
  security: "BearerAuth" | "None" | "Unknown";
  deprecated: boolean;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border bg-bg-subtle px-6 py-5",
      )}
    >
      {/* Title row: method badge + URL + state badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <MethodBadge
          method={tab.method as Parameters<typeof MethodBadge>[0]["method"]}
          size="md"
        />
        <h1 className="break-all font-mono text-base font-semibold text-text-primary">
          {tab.url}
        </h1>
        {deprecated ? (
          <Badge tone="warning" size="md" className="gap-1">
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            Deprecated
          </Badge>
        ) : null}
      </div>

      {/* Summary */}
      {endpointSummary ? (
        <p className="text-sm font-medium leading-relaxed text-text-primary">
          {endpointSummary}
        </p>
      ) : null}

      {/* Description */}
      {endpointDescription ? (
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          {endpointDescription}
        </p>
      ) : null}

      {/* Tag + auth meta */}
      <dl className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {operationId ? (
          <Field label="Operation ID">
            <code className="font-mono text-xs text-text-primary">
              {operationId}
            </code>
          </Field>
        ) : null}

        {tags.length > 0 ? (
          <Field label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} tone="accent" size="sm">
                  <TagIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                  {tag}
                </Badge>
              ))}
            </div>
          </Field>
        ) : null}

        <Field label="Authentication">
          {security === "BearerAuth" ? (
            <Badge tone="info" size="sm" className="gap-1">
              <KeySquare className="h-3 w-3" aria-hidden="true" />
              Bearer JWT
            </Badge>
          ) : security === "None" ? (
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
 * Pull auth + tag data out of an `Operation.extensions` blob. Kept as a
 * free function so the workspace content can call it directly.
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
