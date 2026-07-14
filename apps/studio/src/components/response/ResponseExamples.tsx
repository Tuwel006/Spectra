"use client";

import * as React from "react";
import { Box, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";

import { ResponseJsonViewer } from "./ResponseJsonViewer";
import type { ResponseExample } from "./response.types";

/**
 * Examples browser — one example per documented status code. The user
 * picks an example from a dropdown and the body renders in the pretty
 * viewer. Header map is shown alongside the body for context.
 */
export function ResponseExamples({
  examples,
  selectedId,
  onSelect,
}: {
  examples: readonly ResponseExample[];
  selectedId: string | undefined;
  onSelect?: (id: string) => void;
}): React.ReactElement {
  if (examples.length === 0) {
    return (
      <EmptyState
        icon={<Box className="h-5 w-5" aria-hidden="true" />}
        title="No examples"
        description="This endpoint has no documented example payloads."
        className="h-full"
      />
    );
  }

  const current = selectedId
    ? examples.find((ex) => ex.id === selectedId) ?? examples[0]
    : examples[0];

  const exampleOptions = examples.map((ex) => ({
    value: ex.id,
    label: ex.name,
  }));

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-bg-subtle px-4 py-2">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Example
        </div>
        <Select
          size="sm"
          className="w-64"
          value={current?.id ?? ""}
          onChange={(e) => onSelect?.(e.currentTarget.value)}
          aria-label="Select response example"
          options={exampleOptions}
        />
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {examples.length} {examples.length === 1 ? "example" : "examples"}
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        {current ? (
          <div className="flex h-full flex-col gap-0 lg:grid lg:grid-cols-[1fr_240px]">
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="px-4 pt-3">
                {current.description ? (
                  <p className="mb-3 text-xs leading-relaxed text-text-secondary">
                    {current.description}
                  </p>
                ) : null}
                <ResponseJsonViewer value={current.body} expandedAll={true} />
              </div>
            </div>
            <aside
              className={cn(
                "min-h-0 overflow-auto border-t border-border bg-bg-subtle px-4 py-3 lg:border-l lg:border-t-0",
              )}
            >
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Response headers
              </h4>
              {Object.keys(current.headers).length === 0 ? (
                <p className="mt-2 text-[11px] italic text-text-muted">
                  No headers documented.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {Object.entries(current.headers).map(([name, value]) => (
                    <li key={name} className="flex flex-col">
                      <code className="font-mono text-[11px] text-text-primary">
                        {name}
                      </code>
                      <span className="break-all text-[11px] text-text-secondary">
                        {value === "" ? (
                          <Badge tone="subtle" size="xs">
                            string
                          </Badge>
                        ) : (
                          value
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        ) : null}
      </div>
    </div>
  );
}