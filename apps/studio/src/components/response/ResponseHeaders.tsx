"use client";

import * as React from "react";
import { Inbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";

import { ResponseCopy } from "./ResponseCopy";
import type { ResponseEntry } from "./response.types";

/**
 * Headers table. Columns: Header, Value (placeholders — empty for
 * documented responses), Description.
 */
export function ResponseHeaders({
  entry,
}: {
  entry: ResponseEntry | undefined;
}): React.ReactElement {
  if (!entry) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" aria-hidden="true" />}
        title="No response selected"
        description="Pick a status code above to view its headers."
        className="h-full"
      />
    );
  }

  const headers = entry.response.headers;
  if (headers.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-5 w-5" aria-hidden="true" />}
        title="No documented headers"
        description="This response does not declare any headers in the mock documentation."
        className="h-full"
      />
    );
  }

  return (
    <ScrollArea className="h-full" orientation="vertical">
      <div className="flex flex-col p-4">
        <div className="rounded-md border border-border bg-bg-base">
          <div
            className={cn(
              "grid grid-cols-[180px_1fr_36px] items-center gap-2 border-b border-border bg-bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted",
            )}
          >
            <span>Header</span>
            <span>Description</span>
            <span />
          </div>
          <ul className="divide-y divide-border">
            {headers.map((h) => (
              <li
                key={h.id}
                className="grid grid-cols-[180px_1fr_36px] items-start gap-2 px-3 py-2 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <code className="break-all font-mono text-[11px] text-text-primary">
                    {h.name ?? h.id}
                  </code>
                  <div className="flex flex-wrap items-center gap-1">
                    {h.required ? (
                      <Badge tone="success" size="xs">
                        required
                      </Badge>
                    ) : (
                      <Badge tone="subtle" size="xs">
                        optional
                      </Badge>
                    )}
                    {h.schemaId ? (
                      <Badge tone="accent" size="xs" className="font-mono">
                        {h.schemaId}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-text-secondary">
                  {h.description ?? (
                    <span className="italic text-text-muted">
                      No description provided.
                    </span>
                  )}
                </p>
                <div className="justify-self-end">
                  <ResponseCopy
                    value={h.name ?? h.id}
                    label={`Copy ${h.name ?? h.id}`}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-3 text-[10px] uppercase tracking-wider text-text-muted">
          {headers.length} documented {headers.length === 1 ? "header" : "headers"}
        </p>
      </div>
    </ScrollArea>
  );
}