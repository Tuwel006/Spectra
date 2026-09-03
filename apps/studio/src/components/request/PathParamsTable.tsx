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
 * Path parameters table. Path params don't carry an `enabled` toggle —
 * they're always applied.
 */
export function PathParamsTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.pathParams ?? EMPTY),
  );
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
    <div className="flex flex-col gap-4 px-4 py-4">
      <FormColumnHeader
        columns={[
          { label: "Name", width: "minmax(140px,1.4fr)" },
          { label: "Value", width: "minmax(0,1.6fr)" },
          { label: "Type", width: "80px" },
          { label: "Required", width: "86px" },
          { label: "Description", width: "minmax(0,2fr)" },
          { label: "", width: "32px" },
        ]}
      />

      {rows.length === 0 ? (
        <FormEmptyState
          title="No path parameters"
          description="Path parameters declared in the documentation appear here automatically."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <FormFieldRow
              key={row.id}
              name={row.name}
              onNameChange={(n) => update(row.id, { name: n })}
              namePlaceholder="id"
              value={row.value}
              onValueChange={(v) => update(row.id, { value: v })}
              valuePlaceholder={row.name ? `{{${row.name}}}` : "{{value}}"}
              type={row.type}
              required={row.required}
              description={row.description}
              removeLabel={`Remove path param ${row.name}`}
              onRemove={() => remove(row.id)}
            />
          ))}
        </div>
      )}

      <div className="pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={add}
          className="h-8 gap-1.5 rounded-md border-border/70 px-3 text-[12px] text-text-secondary hover:border-accent/50 hover:bg-accent/5 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Add parameter
        </Button>
      </div>
    </div>
  );
}