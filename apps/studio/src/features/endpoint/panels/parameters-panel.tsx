"use client";

import { ParameterTable } from "@/components/common/parameter-table";
import type { FlatOperation } from "@/lib/tree";

interface ParametersPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Parameters sub-tab — shows path parameters for the current operation.
 */
export function ParametersPanel({ operation }: ParametersPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Path parameters
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Variables interpolated into the URL template.
        </p>
      </div>
      <ParameterTable
        parameters={operation.request.pathParameters}
        schemaLookup={(id) => id ?? "any"}
        emptyLabel="This endpoint has no path parameters."
      />
    </div>
  );
}