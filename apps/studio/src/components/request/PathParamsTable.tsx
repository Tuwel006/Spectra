"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { useRequestDraftStore } from "./request.store";

/**
 * Path parameters table.
 *
 * <p>
 *   Path params don't carry an `enabled` toggle — they're always
 *   applied. The editor disables the value column for required params
 *   when the operation says they're read-only, and shows the expected
 *   type to nudge the user.
 * </p>
 */
export function PathParamsTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore((s) => s.drafts[endpointId]?.pathParams ?? []);
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const update = (id: string, partial: Partial<(typeof rows)[number]>) => {
    patch(
      endpointId,
      "pathParams",
      rows.map((r) => (r.id === id ? { ...r, ...partial } : r)),
    );
  };

  const add = () => {
    const id = `pp-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "pathParams", [
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
      "pathParams",
      rows.filter((r) => r.id !== id),
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <Header />

      {rows.length === 0 ? (
        <EmptyState
          title="No path parameters"
          description="Path parameters declared in the documentation appear here automatically."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[1.4fr_0.6fr_0.4fr_0.6fr_2.4fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2"
            >
              <Input
                size="sm"
                value={row.name}
                onChange={(e) => update(row.id, { name: e.currentTarget.value })}
                placeholder="id"
              />
              <Badge>{row.type}</Badge>
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
                {row.required ? "Required" : "Optional"}
              </span>
              <Input
                size="sm"
                value={row.value}
                onChange={(e) => update(row.id, { value: e.currentTarget.value })}
                placeholder={`{{${row.name || "value"}}}`}
              />
              <span className="truncate text-[11px] text-text-muted">
                {row.description ?? "—"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove path param ${row.name}`}
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
    <div className="grid grid-cols-[1.4fr_0.6fr_0.4fr_0.6fr_2.4fr_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
      <span>Name</span>
      <span>Type</span>
      <span>Required</span>
      <span>Value</span>
      <span>Description</span>
      <span />
    </div>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center justify-center rounded border border-border bg-bg-muted",
        "px-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary",
      )}
    >
      {children}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-dashed border-border bg-bg-subtle px-4 py-8 text-center">
      <p className="text-xs font-medium text-text-secondary">{title}</p>
      <p className="text-[11px] text-text-muted">{description}</p>
    </div>
  );
}
