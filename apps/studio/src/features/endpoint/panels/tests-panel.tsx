"use client";

import { FlaskConical } from "lucide-react";

import { Badge, EmptyState } from "@/components/ui";
import type { FlatOperation } from "@/lib/tree";

interface TestsPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Tests sub-tab — placeholder for the future testing feature.
 *
 * Renders the declared response codes so the user can already start
 * drafting test cases (response-code expectations).
 */
export function TestsPanel({ operation }: TestsPanelProps) {
  const codes = Object.keys(operation.responses);

  if (codes.length === 0) {
    return (
      <EmptyState
        icon={<FlaskConical className="size-4" aria-hidden />}
        title="No tests yet"
        description="Declare response codes on this operation to start authoring tests."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="size-4 text-text-muted" aria-hidden />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Suggested assertions
        </h2>
        <Badge variant="subtle">auto-generated</Badge>
      </div>
      <ul className="flex flex-col gap-1">
        {codes.map((code) => (
          <li
            key={code}
            className="flex items-center gap-2 rounded-md border border-border bg-bg-base px-3 py-2 text-xs"
          >
            <span className="font-mono font-semibold text-text-primary">{code}</span>
            <span className="text-text-muted">
              → expect status to be {code}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}