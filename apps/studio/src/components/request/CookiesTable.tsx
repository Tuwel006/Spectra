"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequestDraftStore } from "./request.store";

const EMPTY: readonly never[] = [];

/**
 * Simple key/value table for cookies. Mock documentation rarely
 * declares cookies today, but the table still needs to be present
 * per the spec.
 */
export function CookiesTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.cookies ?? EMPTY),
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const update = (id: string, partial: Partial<(typeof rows)[number]>) => {
    patch(
      endpointId,
      "cookies",
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const add = () => {
    patch(endpointId, "cookies", [
      ...rows,
      { id: `cookie-${Math.random().toString(36).slice(2, 8)}`, name: "", value: "" },
    ]);
  };

  const remove = (id: string) => {
    patch(
      endpointId,
      "cookies",
      rows.filter((r) => r.id !== id),
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <Header />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-subtle px-4 py-8 text-center">
          <p className="text-xs font-medium text-text-secondary">No cookies</p>
          <p className="text-[11px] text-text-muted">
            Add cookies that this request should send.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_2fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2"
            >
              <Input
                size="sm"
                value={row.name}
                onChange={(e) => update(row.id, { name: e.currentTarget.value })}
                placeholder="cookie-name"
              />
              <Input
                size="sm"
                value={row.value}
                onChange={(e) => update(row.id, { value: e.currentTarget.value })}
                placeholder="value"
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove cookie ${row.name}`}
                onClick={() => remove(row.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div>
        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5" />
          Add cookie
        </Button>
      </div>
    </div>
  );
}

function Header(): React.ReactElement {
  return (
    <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span>Name</span>
      <span>Value</span>
      <span />
    </div>
  );
}
