"use client";

import { ParameterTable } from "@/components/common/parameter-table";
import type { FlatOperation } from "@/lib/tree";

interface HeadersPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Headers sub-tab — shows headers the operation expects the caller to set.
 */
export function HeadersPanel({ operation }: HeadersPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Request headers
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Headers that must accompany every request to this endpoint.
        </p>
      </div>
      <ParameterTable
        parameters={operation.request.headers}
        schemaLookup={(id) => id ?? "string"}
        emptyLabel="No custom headers required."
      />
    </div>
  );
}