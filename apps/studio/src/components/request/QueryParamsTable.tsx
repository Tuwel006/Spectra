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
 * Query parameters table. Each row has an Enabled toggle and the
 * standard name / value / type / required / description columns.
 */
export function QueryParamsTable({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const rows = useRequestDraftStore(
    useShallow((s) => s.drafts[endpointId]?.queryParams ?? EMPTY),
  );
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
      <FormColumnHeader
        columns={[
          { label: "Enabled", width: "28px" },
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
          title="No query parameters"
          description="Add a parameter or pick an endpoint that declares one."
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
              namePlaceholder="query"
              value={row.value}
              onValueChange={(v) => update(row.id, { value: v })}
              valuePlaceholder={row.name ? `?${row.name}=` : "?key="}
              type={row.type}
              required={row.required}
              description={row.description}
              removeLabel={`Remove query param ${row.name}`}
              onRemove={() => remove(row.id)}
            />
          ))}
        </div>
      )}
      <div>
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add parameter
        </Button>
      </div>
    </div>
  );
}