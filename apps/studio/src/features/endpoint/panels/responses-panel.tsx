"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Clock, Download, Hash, Layers, Sparkles } from "lucide-react";

import { ResponseTable } from "@/components/common/response-table";
import { formatBytes, formatDuration, formatJson } from "@/lib/format";
import { Badge, Button, Segmented, StatusPill } from "@/components/ui";
import { useUiStore } from "@/store/ui-store";
import type { FlatOperation } from "@/lib/tree";

const JsonView = dynamic(() => import("react18-json-view"), {
  ssr: false,
  loading: () => <div className="text-xs text-text-muted">Loading…</div>,
});

interface ResponsesPanelProps {
  readonly operation: FlatOperation;
}

const VIEW_OPTIONS = [
  { id: "pretty", label: "Pretty" },
  { id: "raw", label: "Raw" },
  { id: "preview", label: "Preview" },
  { id: "schema", label: "Schema" },
  { id: "timeline", label: "Timeline" },
] as const;
type ViewId = (typeof VIEW_OPTIONS)[number]["id"];

/**
 * Responses sub-tab — table of declared responses plus a preview
 * pane that imitates a real network response (status, duration, size,
 * headers, body).
 *
 * Since the studio is offline, the preview pane renders synthetic
 * data derived from the operation id so it stays consistent across
 * reloads.
 */
export function ResponsesPanel({ operation }: ResponsesPanelProps) {
  const [active, setActive] = useState<string>("200");
  const [view, setView] = useState<ViewId>("pretty");
  const pushToast = useUiStore((state) => state.pushToast);

  const codes = Object.keys(operation.responses).sort();
  const target = codes[0] ?? "200";
  const selected = codes.includes(active) ? active : target;
  const response = operation.responses[selected];

  const fakeBody = mockBodyFor(operation, selected);
  const fakeHeaders = mockHeadersFor(selected);
  const fakeSize = formatBytes(JSON.stringify(fakeBody).length);
  const fakeDuration = formatDuration(syntheticDuration(operation.id, selected));

  return (
    <div className="flex flex-col gap-4">
      <ResponseTable responses={operation.responses} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Preview
        </span>
        <Segmented<ViewId>
          value={view}
          onChange={setView}
          options={VIEW_OPTIONS.map(({ id, label }) => ({ id, label }))}
          size="sm"
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(formatJson(fakeBody));
              pushToast({ title: "Copied response body", variant: "success" });
            }}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              pushToast({
                title: "Downloaded response",
                description: "Response saved to your downloads folder.",
                variant: "success",
              })
            }
          >
            <Download className="size-3.5" /> Download
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <aside className="flex flex-col gap-3 rounded-md border border-border bg-bg-base p-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              Status
            </span>
            <div className="flex items-center gap-2">
              <StatusPill status={Number(selected)} />
              <span className="text-xs text-text-secondary">
                {response?.description ?? "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Duration</span>
            <span className="flex items-center gap-1 font-mono text-text-primary">
              <Clock className="size-3" aria-hidden /> {fakeDuration}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Size</span>
            <span className="flex items-center gap-1 font-mono text-text-primary">
              <Hash className="size-3" aria-hidden /> {fakeSize}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Headers</span>
            <span className="font-mono text-text-primary">
              {fakeHeaders.length}
            </span>
          </div>
          <Badge variant="subtle">Mock response</Badge>
        </aside>

        <div className="overflow-hidden rounded-md border border-border bg-bg-base">
          {view === "pretty" || view === "preview" ? (
            <div className="max-h-[480px] overflow-auto p-3">
              <JsonView
                src={fakeBody}
                theme="default"
                collapsed={false}
                displaySize
                displayTypes
              />
            </div>
          ) : null}
          {view === "raw" ? (
            <pre className="max-h-[480px] overflow-auto p-3 font-mono text-[11px] text-text-primary">
              {formatJson(fakeBody)}
            </pre>
          ) : null}
          {view === "schema" ? (
            <div className="p-3 text-xs text-text-muted">
              <Layers className="mr-1 inline-block size-3" aria-hidden />
              {response?.body?.content
                ? Object.entries(response.body.content)
                    .map(([type, media]) => `${type} → ${media.schema?.id ?? "—"}`)
                    .join("\n")
                : "No schema declared."}
            </div>
          ) : null}
          {view === "timeline" ? (
            <ul className="flex flex-col gap-1 p-3 text-xs text-text-muted">
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-accent" aria-hidden />
                Request received
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-accent" aria-hidden />
                Authenticated
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-accent" aria-hidden />
                Route matched: {operation.pathId}
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="size-3 text-accent" aria-hidden />
                Response prepared ({fakeDuration})
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function mockHeadersFor(status: string): readonly { name: string; value: string }[] {
  return [
    { name: "Content-Type", value: "application/json" },
    { name: "X-Request-Id", value: "req_mock" },
    { name: "X-Status-Reason", value: status },
  ];
}

function mockBodyFor(operation: FlatOperation, status: string): Record<string, unknown> {
  if (status.startsWith("2")) {
    return {
      ok: true,
      operation: operation.operationId ?? operation.id,
      timestamp: new Date("2026-07-13T09:14:22.118Z").toISOString(),
    };
  }
  return {
    ok: false,
    code: status,
    message: "Mock error response — backend not connected.",
  };
}

function syntheticDuration(id: string, status: string): number {
  let hash = 0;
  for (const char of id + status) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 35 + (hash % 320);
}