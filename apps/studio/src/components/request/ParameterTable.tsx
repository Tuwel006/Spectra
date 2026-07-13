"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { Parameter } from "@spectra/core";

interface ParameterTableProps {
  parameters: readonly Parameter[];
  title: string;
  className?: string;
}

/**
 * Renders a table of parameters (path/query/header).
 * Shows name, location, required badge, and schema type.
 */
export function ParameterTable({ parameters, title, className }: ParameterTableProps) {
  if (parameters.length === 0) {
    return (
      <div className={cn("py-4 text-center text-xs text-[--color-text-muted]", className)}>
        No {title.toLowerCase()}.
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-[--color-border] overflow-hidden", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[--color-border] bg-[--color-bg-muted]">
            <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Name</th>
            <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Type</th>
            <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Required</th>
            <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Description</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, idx) => (
            <tr
              key={param.id}
              className={cn(
                "border-b border-[--color-border] transition-colors hover:bg-[--color-bg-subtle]",
                idx === parameters.length - 1 && "border-0"
              )}
            >
              <td className="px-4 py-2.5 font-mono text-[--color-text-primary]">
                {param.name ?? param.id}
              </td>
              <td className="px-4 py-2.5 text-[--color-text-muted]">
                {param.schemaId ?? "string"}
              </td>
              <td className="px-4 py-2.5">
                {param.required ? (
                  <Badge variant="error">required</Badge>
                ) : (
                  <Badge variant="default">optional</Badge>
                )}
              </td>
              <td className="px-4 py-2.5 text-[--color-text-muted]">
                {param.description ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
