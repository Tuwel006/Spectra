"use client";

import { ParameterTable } from "@/components/common/parameter-table";
import type { FlatOperation } from "@/lib/tree";

interface QueryPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Query sub-tab — shows query string parameters for the current operation.
 */
export function QueryPanel({ operation }: QueryPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Query parameters
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Appended to the URL as <code>?key=value</code> pairs.
        </p>
      </div>
      <ParameterTable
        parameters={operation.request.queryParameters}
        schemaLookup={(id) => id ?? "any"}
        emptyLabel="This endpoint does not accept query parameters."
      />
    </div>
  );
}