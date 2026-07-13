"use client";

import { Badge, StatusPill } from "@/components/ui";
import type { Response } from "@spectra/core";

interface ResponseTableProps {
  readonly responses: Readonly<Record<string, Response>>;
}

/**
 * Tabular view of every response declared on an operation.
 * Each row links to the response preview (rendered separately).
 */
export function ResponseTable({ responses }: ResponseTableProps) {
  const codes = Object.keys(responses).sort();
  if (codes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-4 text-center text-xs text-text-muted">
        No responses declared.
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-bg-muted text-[11px] uppercase tracking-wider text-text-muted">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Description</th>
            <th className="px-3 py-2 text-left font-semibold">Content Types</th>
            <th className="px-3 py-2 text-left font-semibold">Headers</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code, index) => {
            const response = responses[code];
            const contentTypes = response?.body?.content
              ? Object.keys(response.body.content)
              : [];
            return (
              <tr
                key={code}
                className={index % 2 === 0 ? "bg-bg-base" : "bg-bg-subtle"}
              >
                <td className="px-3 py-2">
                  <StatusPill status={Number(code)} />
                </td>
                <td className="px-3 py-2 text-text-secondary">
                  {response?.description ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {contentTypes.map((type) => (
                      <Badge key={type} variant="subtle">
                        {type}
                      </Badge>
                    ))}
                    {contentTypes.length === 0 ? (
                      <span className="text-text-muted">—</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 text-text-muted">
                  {response?.headers?.length ?? 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}