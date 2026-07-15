"use client";

import * as React from "react";
import { ExternalLink, KeySquare, Lock, Tag as TagIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { Operation } from "@spectra/core";
import { mockDocumentation } from "@/mock/documentation";

import { useWorkspace } from "./hooks/useWorkspace";
import { useWorkspaceStore } from "./store/workspaceStore";
import { readOperationTagsAndAuth } from "./EndpointOverview";
import { openResource } from "./openResource";
import { CollapsibleSection } from "./CollapsibleSection";

/**
 * The Documentation section of an endpoint workspace.
 *
 * Surfaces every metadata field the spec calls for:
 *   • Summary / Description
 *   • Tags (clickable → opens a Schema tab for the matching tag)
 *   • Authentication
 *   • Operation ID
 *   • Referenced schemas / parameters / responses / requestBodies
 *
 * Anything that references a `Schema` / `Parameter` / `Response` etc.
 * is rendered as a clickable chip that opens a new workspace tab on
 * click — matching the spec's "Clickable reusable components" rule.
 */
export function DocumentationSection({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  const meta = readOperationTagsAndAuth(operation);
  const { openTab } = useWorkspace();

  const open = useWorkspaceStore(
    (s) => s.ui[tabId]?.sections.documentation ?? true,
  );
  const toggleSection = useWorkspaceStore((s) => s.toggleSection);

  // Collect every reference the operation makes — schemas (in body /
  // response), parameters, etc. — and turn them into clickable chips.
  const refs = collectReferences(operation);

  return (
    <CollapsibleSection
      id={`doc-${tabId}`}
      title="Documentation"
      open={open}
      onToggle={() => toggleSection(tabId, "documentation")}
    >
      <div className="flex flex-col gap-4 px-6 py-5">
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
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const tagRef = mockDocumentation.tags.find(
                        (t) => t.name === tag,
                      );
                      if (tagRef) {
                        openResource(openTab, {
                          resourceType: "schema",
                          resourceId: tagRef.id,
                          title: tag,
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent-subtle px-2 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent hover:text-accent-fg"
                  >
                    <TagIcon className="h-3 w-3" aria-hidden />
                    {tag}
                    <ExternalLink
                      className="h-2.5 w-2.5 opacity-60"
                      aria-hidden
                    />
                  </button>
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

        {/* Referenced components */}
        {refs.length > 0 ? (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Referenced Components
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {refs.map((ref) => (
                <Tooltip
                  key={`${ref.kind}-${ref.id}`}
                  content={`Open ${ref.kind}: ${ref.label}`}
                  side="bottom"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openResource(openTab, {
                        resourceType: ref.kind,
                        resourceId: ref.id,
                        title: ref.label,
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border border-border bg-bg-subtle px-2 py-0.5",
                      "text-xs font-medium text-text-secondary",
                      "transition-colors hover:bg-bg-muted hover:text-text-primary",
                    )}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-text-muted">
                      {ref.kind}
                    </span>
                    <span>{ref.label}</span>
                    <ExternalLink
                      className="h-2.5 w-2.5 opacity-60"
                      aria-hidden
                    />
                  </button>
                </Tooltip>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </CollapsibleSection>
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

interface Ref {
  readonly id: string;
  readonly label: string;
  readonly kind:
    | "schema"
    | "parameter"
    | "response"
    | "requestBody"
    | "example";
}

/**
 * Walk the operation's request / response / parameter collections and
 * return every distinct referenced component as a chip.
 */
function collectReferences(op: Operation): readonly Ref[] {
  const refs: Ref[] = [];
  const seen = new Set<string>();

  const push = (
    kind: Ref["kind"],
    id: string | undefined,
    label?: string,
  ): void => {
    if (!id) return;
    const key = `${kind}:${id}`;
    if (seen.has(key)) return;
    seen.add(key);
    refs.push({ kind, id, label: label ?? id });
  };

  for (const param of op.request.pathParameters) {
    push("parameter", param.id, param.name);
  }
  for (const param of op.request.queryParameters) {
    push("parameter", param.id, param.name);
  }
  for (const header of op.request.headers) {
    push("parameter", header.id, header.name ?? header.id);
  }
  if (op.request.body) {
    // RequestBody itself isn't a BaseNode — key it by the first
    // referenced schema so the chip opens something useful.
    const mediaEntries = Object.entries(op.request.body.content);
    for (const [contentType, media] of mediaEntries) {
      push("schema", media.schema?.id, media.schema?.id);
      if (mediaEntries.length > 0 && media.schema?.id) {
        push(
          "requestBody",
          `${contentType}:${media.schema.id}`,
          `Body (${contentType})`,
        );
      }
    }
  }
  // Responses are keyed by status code in the NamedCollection.
  for (const [status, response] of Object.entries(op.responses)) {
    push("response", status, `Status ${status}`);
    if (response.body) {
      for (const media of Object.values(response.body.content)) {
        push("schema", media.schema?.id, media.schema?.id);
      }
    }
  }
  return refs;
}