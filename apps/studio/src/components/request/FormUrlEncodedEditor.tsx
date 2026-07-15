"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useRequestDraftStore } from "./request.store";

const EMPTY: readonly never[] = [];

/**
 * URL-encoded (key=value) editor. Same shape as
 * {@link MultipartEditor} minus the file kind.
 */
export function FormUrlEncodedEditor({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.urlEncoded ?? EMPTY),
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const update = (id: string, partial: Partial<(typeof rows)[number]>) => {
    patch(
      endpointId,
      "urlEncoded",
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const add = () => {
    const id = `uve-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "urlEncoded", [
      ...rows,
      { id, key: "", value: "", enabled: true },
    ]);
  };

  const remove = (id: string) => {
    patch(
      endpointId,
      "urlEncoded",
      rows.filter((r) => r.id !== id),
    );
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <Header />
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-bg-subtle px-4 py-6 text-center text-[11px] italic text-text-muted">
          No form fields. Add a key/value row below.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[auto_1.4fr_2fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2",
                !row.enabled && "opacity-60",
              )}
            >
              <Checkbox
                checked={row.enabled}
                onChange={(e) =>
                  update(row.id, { enabled: e.currentTarget.checked })
                }
                aria-label={`Enable ${row.key || "field"}`}
              />
              <Input
                size="sm"
                value={row.key}
                onChange={(e) => update(row.id, { key: e.currentTarget.value })}
                placeholder="key"
              />
              <Input
                size="sm"
                value={row.value}
                onChange={(e) =>
                  update(row.id, { value: e.currentTarget.value })
                }
                placeholder="value"
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${row.key}`}
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
          Add row
        </Button>
      </div>
    </div>
  );
}

function Header(): React.ReactElement {
  return (
    <div className="grid grid-cols-[auto_1.4fr_2fr_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span />
      <span>Key</span>
      <span>Value</span>
      <span />
    </div>
  );
}
