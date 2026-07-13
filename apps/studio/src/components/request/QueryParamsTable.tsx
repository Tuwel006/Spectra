"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { useRequestDraftStore } from "./request.store";

/**
 * Query parameters table. Mirror of {@link PathParamsTable} with an
 * extra "Enabled" toggle column.
 */
export function QueryParamsTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore((s) => s.drafts[endpointId]?.queryParams ?? []);
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const update = (id: string, partial: Partial<(typeof rows)[number]>) => {
    patch(
      endpointId,
      "queryParams",
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const add = () => {
    const id = `qp-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "queryParams", [
      ...rows,
      {
        id,
        name: "",
        value: "",
        type: "string",
        required: false,
        enabled: true,
      },
    ]);
  };

  const remove = (id: string) => {
    patch(
      endpointId,
      "queryParams",
      rows.filter((r) => r.id !== id),
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <Header />
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-subtle px-4 py-8 text-center">
          <p className="text-xs font-medium text-text-secondary">
            No query parameters
          </p>
          <p className="text-[11px] text-text-muted">
            Add a parameter or pick an endpoint that declares one.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-[auto_1.4fr_0.6fr_0.6fr_1.6fr_2.4fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2",
                !row.enabled && "opacity-60",
              )}
            >
              <Switch
                size="sm"
                checked={row.enabled}
                onChange={(e) => update(row.id, { enabled: e.currentTarget.checked })}
                aria-label={`Enable ${row.name || "parameter"}`}
              />
              <Input
                size="sm"
                value={row.name}
                onChange={(e) => update(row.id, { name: e.currentTarget.value })}
                placeholder="query"
              />
              <Badge>{row.type}</Badge>
              <Input
                size="sm"
                value={row.value}
                onChange={(e) => update(row.id, { value: e.currentTarget.value })}
                placeholder={row.name ? `?${row.name}=` : "?key="}
              />
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {row.required ? "Required" : "Optional"}
              </span>
              <span className="truncate text-[11px] text-text-muted">
                {row.description ?? "—"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove query param ${row.name}`}
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
          Add parameter
        </Button>
      </div>
    </div>
  );
}

function Header(): React.ReactElement {
  return (
    <div className="grid grid-cols-[auto_1.4fr_0.6fr_0.6fr_1.6fr_2.4fr_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span />
      <span>Name</span>
      <span>Type</span>
      <span>Value</span>
      <span>Required</span>
      <span>Description</span>
      <span />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="inline-flex h-6 items-center justify-center rounded border border-border bg-bg-muted px-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
      {children}
    </span>
  );
}
