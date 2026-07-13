"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { Operation } from "@spectra/core";

interface OverviewPanelProps {
  operation: Operation;
}

/**
 * Overview tab — shows summary, description, operationId, tags and auth info.
 * First panel the user sees when opening an endpoint.
 */
export function OverviewPanel({ operation }: OverviewPanelProps) {
  const tags = (operation.extensions?.["x-tags"] as string[] | undefined) ?? [];
  const security = operation.extensions?.["x-security"] as string | null | undefined;
  const responseCodes = Object.keys(operation.responses);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      {/* Summary + description */}
      <section>
        <h2 className="text-base font-semibold text-[--color-text-primary] mb-1">
          {operation.name ?? operation.summary ?? operation.operationId}
        </h2>
        {operation.summary && operation.name && (
          <p className="text-sm font-medium text-[--color-text-secondary] mb-2">
            {operation.summary}
          </p>
        )}
        {operation.description && (
          <p className="text-sm leading-relaxed text-[--color-text-muted]">
            {operation.description}
          </p>
        )}
      </section>

      {/* Metadata grid */}
      <section className="grid grid-cols-2 gap-4 rounded-lg border border-[--color-border] p-4 bg-[--color-bg-subtle] text-sm">
        <MetaRow label="Operation ID" value={operation.operationId ?? "—"} mono />
        <MetaRow label="HTTP Method" value={operation.method} mono />
        <MetaRow
          label="Authentication"
          value={
            security
              ? <Badge variant="info">{security}</Badge>
              : <span className="text-[--color-text-muted]">None</span>
          }
        />
        <MetaRow
          label="Tags"
          value={
            tags.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {tags.map((t) => (
                  <Badge key={t} variant="accent">{t}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-[--color-text-muted]">None</span>
            )
          }
        />
      </section>

      {/* Responses summary */}
      {responseCodes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
            Responses
          </h3>
          <div className="flex flex-col gap-1">
            {responseCodes.map((code) => {
              const resp = operation.responses[code];
              return (
                <div
                  key={code}
                  className="flex items-start gap-3 rounded-md border border-[--color-border] px-4 py-2.5 bg-[--color-bg-subtle]"
                >
                  <StatusBadge code={code} />
                  <span className="text-sm text-[--color-text-muted] leading-snug">
                    {resp?.description ?? "No description"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[--color-text-muted] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={cn(
          "text-sm text-[--color-text-secondary]",
          mono && "font-mono text-xs"
        )}
      >
        {value}
      </span>
    </div>
  );
}
