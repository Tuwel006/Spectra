"use client";

import * as React from "react";
import { Code2, FileJson } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { JsonEditor } from "./JsonEditor";
import { TextEditor } from "./TextEditor";
import { useRequestDraftStore } from "./request.store";
import {
  BODY_TYPE_LABEL,
  type RequestExample,
} from "./request.types";
import type { Operation } from "@spectra/core";
import { collectParamHints } from "./request.types";

/**
 * Examples browser — shows the operation's example payloads (request +
 * response) and lets the user copy them into the editor's body / response
 * panes. No network calls; everything is read from the in-memory
 * `Operation`.
 */
export function ExamplesPanel({
  operation,
}: {
  operation: Operation;
}): React.ReactElement {
  const examples = collectParamHints(operation).examples;
  const selectedId = useRequestDraftStore(
    (s) => s.drafts[operation.id]?.selectedExampleId,
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  const current = pickExample(examples, selectedId);

  if (examples.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs italic text-text-muted">
          No examples are attached to this operation. The editor below is
          empty until a future parser fills it in.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-subtle px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
          Example
        </div>
        <Select
          size="sm"
          className="w-64"
          value={current?.id ?? ""}
          onChange={(e) => patch(operation.id, "selectedExampleId", e.currentTarget.value)}
          aria-label="Select example"
          options={examples.map((ex) => ({ value: ex.id, label: ex.name }))}
        />
        {current?.responseStatus !== undefined ? (
          <Badge tone="info" size="sm">
            Status {current.responseStatus}
          </Badge>
        ) : null}
        {current?.method ? (
          <Badge tone="neutral" size="sm">
            {current.method}
          </Badge>
        ) : null}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-2">
        <ExampleColumn
          title="Request body"
          body={current?.requestBody}
        />
        <ExampleColumn
          title="Response body"
          body={current?.responseBody}
          tone="response"
        />
      </div>

      <div className="border-t border-border bg-bg-subtle px-4 py-2 text-[10px] uppercase tracking-wider text-text-muted">
        Active body type: {BODY_TYPE_LABEL["json"]}
      </div>
    </div>
  );
}

function pickExample(
  examples: readonly RequestExample[],
  selectedId: string | undefined,
): RequestExample | undefined {
  if (examples.length === 0) return undefined;
  if (selectedId) {
    const match = examples.find((e) => e.id === selectedId);
    if (match) return match;
  }
  return examples[0];
}

function ExampleColumn({
  title,
  body,
  tone = "request",
}: {
  title: string;
  body: unknown;
  tone?: "request" | "response";
}): React.ReactElement {
  const text = React.useMemo(() => stringifyBody(body), [body]);
  return (
    <div className="flex min-h-0 flex-col border-border lg:border-r">
      <div className="flex items-center gap-2 border-b border-border bg-bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        <FileJson className="h-3 w-3" aria-hidden="true" />
        {title}
        <span className="ml-auto text-text-muted">{text.length} chars</span>
      </div>
      <div className="min-h-[200px] flex-1">
        {tone === "request" ? (
          <JsonEditor value={text} onChange={() => undefined} readOnly />
        ) : (
          <TextEditor language="text" value={text} onChange={() => undefined} readOnly />
        )}
      </div>
    </div>
  );
}

function stringifyBody(body: unknown): string {
  if (body === undefined) return "";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}