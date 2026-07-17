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
      <FormColumnHeader
        columns={[
          { label: "Name", width: "minmax(140px,1fr)" },
          { label: "Value", width: "minmax(0,2fr)" },
          { label: "", width: "32px" },
        ]}
      />
      {rows.length === 0 ? (
        <FormEmptyState
          title="No cookies"
          description="Add cookies that this request should send."
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <FormFieldRow
              key={row.id}
              name={row.name}
              onNameChange={(n) => update(row.id, { name: n })}
              namePlaceholder="cookie-name"
              value={row.value}
              onValueChange={(v) => update(row.id, { value: v })}
              valuePlaceholder="value"
              removeLabel={`Remove cookie ${row.name}`}
              onRemove={() => remove(row.id)}
            />
          ))}
        </div>
      )}
      <div>
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add cookie
        </Button>
      </div>
    </div>
  );
}