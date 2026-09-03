"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonViewPanel } from "@/components/ui/json-view";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

import {
  familyOf,
  type ResponseEntry,
  type ResponseExample,
} from "@/components/response/response.types";

/**
 * Single-tab "Examples" view of the response area.
 *
 * <p>Layout:</p>
 *
 * <pre>
 *   EXAMPLE  [ 200 Success ▾ ]  [2xx]   18 examples · 18 statuses
 *   ────────────────────────────────────────────────────────
 *   { body here, full width, full height, syntax-highlighted }
 * </pre>
 *
 * <p>The dropdown lists every documented status-code example. The
 * selected entry drives the body view below. We deliberately do NOT
 * split the right side into documentation / runtime sub-panes — the
 * example dropdown is the single switch the user needs.</p>
 */
export function ExamplesTab({
  examples,
  responses,
  selectedId,
  onSelect,
}: {
  examples: readonly ResponseExample[];
  responses: readonly ResponseEntry[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}): React.ReactElement {
  if (examples.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
        title="No examples documented"
        description="This operation has no documented response payloads yet."
        className="h-full"
      />
    );
  }

  const current =
    examples.find((e) => e.id === selectedId) ?? examples[0]!;
  const currentStatus = current.id.split(":").pop() ?? "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Picker bar — sticky at the top of the right-side column. */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border/70 bg-bg-subtle/50 px-4 py-2.5">
        <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Example
        </div>
        <Select
          size="sm"
          className="w-72"
          value={current.id}
          onChange={(e) => onSelect(e.currentTarget.value)}
          aria-label="Select response example"
          options={examples.map((ex) => ({
            value: ex.id,
            label: ex.name,
          }))}
        />
        <StatusFamilyBadge status={currentStatus} />
        <span className="ml-auto text-[10px] uppercase tracking-wider text-text-muted">
          {examples.length} {examples.length === 1 ? "example" : "examples"}
          {responses.length > 0
            ? ` · ${responses.length} documented ${responses.length === 1 ? "status" : "statuses"}`
            : ""}
        </span>
      </div>

      {/* Body — full area, no nested split. */}
      <div className="min-h-0 flex-1 p-3">
        <JsonViewPanel
          value={current.body}
          className="h-full"
          title={
            <span className="font-mono normal-case tracking-normal">
              {currentStatus} ·{" "}
              <span className="text-text-muted">application/json</span>
            </span>
          }
          meta={<span>JSON</span>}
          emptyMessage="No response body documented for this example."
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small bits                                                           */
/* ------------------------------------------------------------------ */

function StatusFamilyBadge({ status }: { status: string }): React.ReactElement {
  const family = familyOf(status);
  const tone = (() => {
    switch (family) {
      case "2xx":
        return "success" as const;
      case "3xx":
        return "info" as const;
      case "4xx":
        return "warning" as const;
      case "5xx":
        return "danger" as const;
      default:
        return "neutral" as const;
    }
  })();
  return (
    <Badge tone={tone} size="xs" className={cn("uppercase")}>
      {family}
    </Badge>
  );
}