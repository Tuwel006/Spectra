"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { formatJson } from "@/lib/format";
import { Badge, Button } from "@/components/ui";
import { readExample } from "@/types/extension";
import type { FlatOperation } from "@/lib/tree";

interface ExamplesPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Examples sub-tab — surfaces any `x-example` extension on the operation.
 */
export function ExamplesPanel({ operation }: ExamplesPanelProps) {
  const example = readExample(operation.extensions);
  const pushToast = useUiStore((state) => state.pushToast);

  const [request, response] = splitExample(example);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ExampleCard
        title="Request"
        value={request}
        onCopy={() => {
          navigator.clipboard?.writeText(formatJson(request));
          pushToast({ title: "Copied example request", variant: "success" });
        }}
        empty="No request example declared."
      />
      <ExampleCard
        title="Response"
        value={response}
        onCopy={() => {
          navigator.clipboard?.writeText(formatJson(response));
          pushToast({ title: "Copied example response", variant: "success" });
        }}
        empty="No response example declared."
      />
    </div>
  );
}

interface ExampleCardProps {
  readonly title: string;
  readonly value: unknown;
  readonly onCopy: () => void;
  readonly empty: string;
}

function ExampleCard({ title, value, onCopy, empty }: ExampleCardProps) {
  const isEmpty = value === undefined;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-base p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{title}</span>
          <Badge variant="subtle">example</Badge>
        </div>
        {!isEmpty ? (
          <Button size="icon-xs" variant="ghost" aria-label="Copy example" onClick={onCopy}>
            <Copy className="size-3.5" />
          </Button>
        ) : null}
      </div>
      {isEmpty ? (
        <p className="rounded border border-dashed border-border bg-bg-subtle px-3 py-6 text-center text-xs text-text-muted">
          {empty}
        </p>
      ) : (
        <pre className="max-h-80 overflow-auto rounded-md bg-bg-muted p-3 font-mono text-[11px] text-text-primary">
          {formatJson(value)}
        </pre>
      )}
    </div>
  );
}

/**
 * Splits an example value (if it's an object with `request`/`response`)
 * into a tuple. Returns `[undefined, undefined]` otherwise.
 */
function splitExample(value: unknown): readonly [unknown, unknown] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return [obj.request, obj.response];
  }
  return [undefined, undefined];
}