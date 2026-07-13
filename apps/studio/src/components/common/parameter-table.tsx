"use client";

import type { Parameter } from "@spectra/core";

import { Badge } from "@/components/ui";

interface ParameterTableProps {
  readonly parameters: readonly Parameter[];
  readonly schemaLookup: (id: string | undefined) => string;
  readonly emptyLabel?: string;
}

/**
 * Reusable parameter/header/cookie table used by every endpoint panel.
 *
 * Columns:
 *   - Name
 *   - In (location / type)
 *   - Type (resolved from schemaId)
 *   - Required
 *   - Description
 */
export function ParameterTable({
  parameters,
  schemaLookup,
  emptyLabel = "No parameters.",
}: ParameterTableProps) {
  if (parameters.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-4 text-center text-xs text-text-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-bg-muted text-[11px] uppercase tracking-wider text-text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Name</th>
            <th className="px-3 py-2 text-left font-semibold">In</th>
            <th className="px-3 py-2 text-left font-semibold">Type</th>
            <th className="px-3 py-2 text-left font-semibold">Required</th>
            <th className="px-3 py-2 text-left font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((parameter, index) => (
            <tr
              key={parameter.id}
              className={index % 2 === 0 ? "bg-bg-base" : "bg-bg-subtle"}
            >
              <td className="px-3 py-2 font-mono font-medium text-text-primary">
                {parameter.name}
              </td>
              <td className="px-3 py-2 text-text-secondary">{parameter.location}</td>
              <td className="px-3 py-2 font-mono text-text-secondary">
                {schemaLookup(parameter.schemaId)}
              </td>
              <td className="px-3 py-2">
                {parameter.required ? (
                  <Badge variant="accent">required</Badge>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-text-secondary">
                {parameter.description ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}