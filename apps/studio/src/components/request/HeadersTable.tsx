"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { useRequestDraftStore } from "./request.store";
import {
  FormColumnHeader,
  FormEmptyState,
  FormFieldRow,
} from "./FormFieldRow";

const EMPTY: readonly never[] = [];

/**
 * Editable HTTP headers table. Common headers (Content-Type,
 * Accept, Authorization) are pre-populated by the request store —
 * users can override or remove them.
 */
export function HeadersTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.headers ?? EMPTY),
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const update = (id: string, partial: Partial<(typeof rows)[number]>) => {
    patch(
      endpointId,
      "headers",
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const add = () => {
    const id = `hdr-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "headers", [
      ...rows,
      { id, name: "", value: "", enabled: true },
    ]);
  };

  const remove = (id: string) => {
    patch(
      endpointId,
      "headers",
      rows.filter((r) => r.id !== id),
    );
  };

  // Quick suggestions surfaced as small chips under the table.
  const suggestions = ["Content-Type", "Accept", "Authorization", "User-Agent"];

  return (
    <div className="flex flex-col gap-3 p-4">
      <FormColumnHeader
        columns={[
          { label: "Enabled", width: "28px" },
          { label: "Header", width: "minmax(140px,1.4fr)" },
          { label: "Value", width: "minmax(0,1.6fr)" },
          { label: "Description", width: "minmax(0,2fr)" },
          { label: "", width: "32px" },
        ]}
      />
      {rows.length === 0 ? (
        <FormEmptyState
          title="No headers"
          description="Common headers are pre-populated from the documentation."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <FormFieldRow
              key={row.id}
              enabled={row.enabled}
              onEnabledChange={(v) => update(row.id, { enabled: v })}
              name={row.name}
              onNameChange={(n) => update(row.id, { name: n })}
              namePlaceholder="Header-Name"
              value={row.value}
              onValueChange={(v) => update(row.id, { value: v })}
              valuePlaceholder="value"
              description={row.description ?? row.name}
              removeLabel={`Remove header ${row.name}`}
              onRemove={() => remove(row.id)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add header
        </Button>
        {suggestions
          .filter((s) => !rows.some((r) => r.name.toLowerCase() === s.toLowerCase()))
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                patch(endpointId, "headers", [
                  ...rows,
                  { id: `hdr-${Math.random().toString(36).slice(2, 8)}`, name: s, value: "", enabled: true },
                ])
              }
              className="rounded-sm border border-border bg-bg-subtle px-2 py-0.5 text-[11px] text-text-muted hover:bg-bg-muted hover:text-text-primary"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}