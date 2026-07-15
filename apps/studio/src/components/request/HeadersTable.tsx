"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useRequestDraftStore } from "./request.store";

const EMPTY: readonly never[] = [];

/**
 * Editable HTTP headers table. Common headers (`Content-Type`,
 * `Accept`, `Authorization`) are pre-populated by the request store —
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
      <Header />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-subtle px-4 py-8 text-center">
          <p className="text-xs font-medium text-text-secondary">No headers</p>
          <p className="text-[11px] text-text-muted">
            Common headers are pre-populated from the documentation.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[auto_1.4fr_2fr_3fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2",
                !row.enabled && "opacity-60",
              )}
            >
              <Switch
                size="sm"
                checked={row.enabled}
                onChange={(e) => update(row.id, { enabled: e.currentTarget.checked })}
                aria-label={`Enable header ${row.name || "header"}`}
              />
              <Input
                size="sm"
                value={row.name}
                onChange={(e) => update(row.id, { name: e.currentTarget.value })}
                placeholder="Header-Name"
              />
              <Input
                size="sm"
                value={row.value}
                onChange={(e) => update(row.id, { value: e.currentTarget.value })}
                placeholder="value"
              />
              <span className="truncate text-[11px] text-text-muted">
                {row.description ?? row.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove header ${row.name}`}
                onClick={() => remove(row.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={add}>
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
              className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[11px] text-text-muted hover:bg-bg-muted hover:text-text-primary"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

function Header(): React.ReactElement {
  return (
    <div className="grid grid-cols-[auto_1.4fr_2fr_3fr_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span />
      <span>Header</span>
      <span>Value</span>
      <span>Description</span>
      <span />
    </div>
  );
}
