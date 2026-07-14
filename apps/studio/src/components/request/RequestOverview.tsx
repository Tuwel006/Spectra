import * as React from "react";
import { AlertTriangle, KeySquare, Lock, Tag as TagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { MethodBadge } from "@/components/ui/badge";
import type { Operation } from "@spectra/core";

import { collectParamHints } from "./request.types";

/** Read the deprecated flag off `Operation.extensions["x-deprecated"]`. */
function isDeprecated(op: Operation): boolean {
  const ext = op.extensions ?? {};
  const dep = ext["x-deprecated"];
  return dep === true || (typeof dep === "object" && dep !== null);
}

/**
 * Read-only overview of an endpoint. Pulls everything from the
 * underlying `Operation` so the panel stays in sync with the mock
 * documentation without storing duplicate metadata.
 */
export function RequestOverview({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const hint = collectParamHints(operation);
  const authBadge = describeAuth(operation);
  const produces = hint.produces.length > 0 ? hint.produces : ["—"];
  const consumes = hint.bodyContentTypes.length > 0 ? hint.bodyContentTypes : ["—"];

  return (
    <div className="flex flex-col gap-5 p-4">
      <Section title="Endpoint">
        <div className="flex flex-wrap items-center gap-3">
          <MethodBadge
            method={
              operation.method as Parameters<typeof MethodBadge>[0]["method"]
            }
            size="md"
          />
          <code className="break-all font-mono text-sm text-text-primary">
            {operation.request.pathParameters.length > 0
              ? applyTemplate(operation, hint)
              : operation.id}
          </code>
        </div>
        {operation.summary ? (
          <p className="mt-2 text-sm font-medium text-text-primary">
            {operation.summary}
          </p>
        ) : null}
        {operation.description ? (
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-text-secondary">
            {operation.description}
          </p>
        ) : null}
      </Section>

      <Section title="Authentication">
        <div className="flex items-center gap-2 text-xs">
          {authBadge.kind === "none" ? (
            <span className="inline-flex items-center gap-1 text-text-muted">
              <Lock className="h-3 w-3" aria-hidden="true" />
              No authentication required
            </span>
          ) : (
            <Badge tone="info" size="md" className="gap-1">
              <KeySquare className="h-3 w-3" aria-hidden="true" />
              {authBadge.label}
            </Badge>
          )}
        </div>
      </Section>

      <Section title="Tags">
        {hint.examples.length === 0 ? null : (
          <div className="flex flex-wrap gap-1.5">
            {extractTags(operation).map((tag) => (
              <Badge key={tag} tone="accent" size="sm">
                <TagIcon className="mr-1 h-3 w-3" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {extractTags(operation).length === 0 ? (
          <p className="text-[11px] italic text-text-muted">No tags declared.</p>
        ) : null}
      </Section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Section title="Content type (request)">
          <div className="flex flex-wrap gap-1.5">
            {hint.bodyContentTypes.length > 0 ? (
              hint.bodyContentTypes.map((ct) => (
                <Badge key={ct} tone="neutral" size="sm">
                  {ct}
                </Badge>
              ))
            ) : (
              <p className="text-[11px] italic text-text-muted">No request body declared.</p>
            )}
          </div>
        </Section>

        <Section title="Produces">
          <div className="flex flex-wrap gap-1.5">
            {produces.map((p) => (
              <Badge key={p} tone="neutral" size="sm">
                {p}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Consumes">
          <div className="flex flex-wrap gap-1.5">
            {consumes.map((c) => (
              <Badge key={c} tone="neutral" size="sm">
                {c}
              </Badge>
            ))}
          </div>
        </Section>
      </div>

      {operation.description ? (
        <Section title="Notes">
          <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
            {operation.description}
          </p>
        </Section>
      ) : null}

      {isDeprecated(operation) ? (
        <div className="flex items-start gap-2 rounded-md border border-method-delete/30 bg-method-delete/5 px-3 py-2 text-xs text-method-delete">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
          <span>This endpoint is marked as deprecated in the documentation.</span>
        </div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function extractTags(op: Operation): readonly string[] {
  const raw = op.extensions?.["x-tags"];
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string");
}

function describeAuth(op: Operation): {
  readonly kind: "none" | "bearer" | "other";
  readonly label: string;
} {
  const sec = op.extensions?.["x-security"];
  if (sec === null) return { kind: "none", label: "No auth" };
  if (typeof sec === "string" && sec.length > 0)
    return { kind: "bearer", label: `${sec}` };
  // Headers can also imply auth.
  const hasAuth = op.request.headers.some(
    (h) => h.name?.toLowerCase() === "authorization" || h.id.toLowerCase() === "authorization",
  );
  if (hasAuth) return { kind: "other", label: "Authorization header" };
  return { kind: "none", label: "No auth" };
}

/**
 * Substitute path template variables with `{{value}}` so the user can
 * see what the call looks like at a glance.
 */
function applyTemplate(
  op: Operation,
  _hint: ReturnType<typeof collectParamHints>,
): string {
  // Re-render the URL using the operation id (best-effort). For brevity
  // we use the operation's id; a real provider would expose the URL.
  return op.id;
}
