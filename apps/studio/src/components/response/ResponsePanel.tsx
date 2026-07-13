"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InnerTabBar } from "@/components/tabs/InnerTabBar";
import type { Operation } from "@spectra/core";

interface ResponsePanelProps {
  operation: Operation;
  className?: string;
}

const RESPONSE_VIEW_TABS = [
  { id: "pretty",  label: "Pretty" },
  { id: "raw",     label: "Raw" },
  { id: "preview", label: "Preview" },
  { id: "headers", label: "Headers" },
  { id: "schema",  label: "Schema" },
];

/**
 * Response panel showing documented response codes and their schemas.
 * In a future version, this will show actual response data.
 * For now it renders the documented responses from the mock.
 */
export function ResponsePanel({ operation, className }: ResponsePanelProps) {
  const [activeCode, setActiveCode] = React.useState<string>(() => {
    const codes = Object.keys(operation.responses);
    return codes.find((c) => c.startsWith("2")) ?? codes[0] ?? "200";
  });
  const [viewTab, setViewTab] = React.useState("pretty");

  const responseCodes = Object.keys(operation.responses);
  const activeResponse = operation.responses[activeCode];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Status code selector */}
      <div className="flex items-center gap-2 border-b border-[--color-border] px-4 py-2 overflow-x-auto flex-wrap">
        <span className="text-xs text-[--color-text-muted] shrink-0">Response:</span>
        {responseCodes.map((code) => (
          <button
            key={code}
            onClick={() => setActiveCode(code)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activeCode === code
                ? "bg-[--color-bg-muted] text-[--color-text-primary]"
                : "text-[--color-text-muted] hover:bg-[--color-bg-subtle]"
            )}
          >
            <StatusBadge code={code} />
          </button>
        ))}
      </div>

      {/* View tabs */}
      <InnerTabBar
        tabs={RESPONSE_VIEW_TABS}
        activeTab={viewTab}
        onTabChange={setViewTab}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeResponse ? (
          <div className="flex flex-col gap-4">
            {/* Description */}
            {activeResponse.description && (
              <p className="text-sm text-[--color-text-muted]">
                {activeResponse.description}
              </p>
            )}

            {/* Schema reference */}
            {activeResponse.body && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-2">
                  Response Schema
                </h4>
                {Object.entries(activeResponse.body.content).map(([ct, media]) => (
                  <div
                    key={ct}
                    className="flex items-center gap-3 rounded-md border border-[--color-border] px-4 py-3 bg-[--color-bg-subtle]"
                  >
                    <Badge variant="default">{ct}</Badge>
                    {media.schema?.id && (
                      <span className="font-mono text-sm text-[--color-accent]">
                        {media.schema.id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Response headers */}
            {activeResponse.headers.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-2">
                  Response Headers
                </h4>
                <div className="flex flex-col gap-1">
                  {activeResponse.headers.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center gap-3 rounded border border-[--color-border] px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-[--color-text-primary]">
                        {h.name ?? h.id}
                      </span>
                      <span className="text-[--color-text-muted] flex-1">
                        {h.description}
                      </span>
                      {h.required && <Badge variant="error">required</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mock response placeholder */}
            <div className="rounded-lg bg-[--color-bg-muted] border border-[--color-border] p-4">
              <p className="text-xs text-[--color-text-muted] mb-2">Example response</p>
              <pre className="text-xs font-mono text-[--color-text-secondary] whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    success: true,
                    data: { "// schema": activeResponse.body
                      ? Object.values(activeResponse.body.content)[0]?.schema?.id
                      : null },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[--color-text-muted]">No response defined.</p>
        )}
      </div>
    </div>
  );
}
