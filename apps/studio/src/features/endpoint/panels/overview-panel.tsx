"use client";

import { MethodBadge } from "@/components/ui";
import { Kbd } from "@/components/ui";
import type { FlatOperation } from "@/lib/tree";

interface OverviewPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Overview sub-tab — title, description, cURL preview and metadata.
 */
export function OverviewPanel({ operation }: OverviewPanelProps) {
  const curl = buildCurl(operation);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Summary
        </h2>
        <div className="flex items-center gap-2">
          <MethodBadge method={operation.method} />
          <span className="font-mono text-sm">{operation.pathUrl}</span>
        </div>
        <p className="text-sm text-text-secondary">
          {operation.description ?? "No description provided."}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          cURL
        </h2>
        <pre className="overflow-x-auto rounded-md border border-border bg-bg-muted p-3 font-mono text-xs text-text-primary">
          {curl}
        </pre>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Identifiers
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-2 text-xs">
          <dt className="text-text-muted">operationId</dt>
          <dd className="font-mono text-text-primary">
            {operation.operationId ?? "—"}
          </dd>
          <dt className="text-text-muted">path</dt>
          <dd className="font-mono text-text-primary">{operation.pathId}</dd>
          <dt className="text-text-muted">method</dt>
          <dd className="font-mono text-text-primary">{operation.method}</dd>
          <dt className="text-text-muted">shortcut</dt>
          <dd className="text-text-primary">
            <Kbd>⌘</Kbd> <Kbd>K</Kbd> to open the command palette
          </dd>
        </dl>
      </section>
    </div>
  );
}

function buildCurl(op: FlatOperation): string {
  const lines = [`curl -X ${op.method} '${op.pathUrl}'`];
  const auth = op.extensions?.["x-security"];
  if (typeof auth === "string") {
    lines.push(`  -H 'Authorization: Bearer <token>'`);
  }
  lines.push(`  -H 'Accept: application/json'`);
  if (op.method === "POST" || op.method === "PUT" || op.method === "PATCH") {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d '{}'`);
  }
  return lines.join(" \\\n");
}