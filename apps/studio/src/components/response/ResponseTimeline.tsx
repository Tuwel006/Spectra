"use client";

import * as React from "react";
import { Gauge } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

/**
 * Placeholder for the future network-timing timeline (DNS / TCP / TLS
 * / TTFB / Download / Total). Runtime measurements land once HTTP
 * requests are wired in a later phase.
 */
export function ResponseTimeline(): React.ReactElement {
  const stages: readonly { name: string; description: string }[] = [
    { name: "DNS", description: "Domain name resolution" },
    { name: "TCP", description: "Connection establishment" },
    { name: "TLS", description: "TLS handshake" },
    { name: "TTFB", description: "Time to first byte" },
    { name: "Download", description: "Body transfer" },
    { name: "Total", description: "End-to-end request" },
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
      <EmptyState
        icon={<Gauge className="h-5 w-5" aria-hidden="true" />}
        title="Timeline (placeholder)"
        description="Per-stage network timings ship with the runtime phase. Until then, this view shows the future breakdown."
        className="w-full"
      />
      <ul className="grid w-full max-w-md grid-cols-1 gap-1 sm:grid-cols-2">
        {stages.map((s) => (
          <li
            key={s.name}
            className="flex items-center justify-between rounded-md border border-dashed border-border bg-bg-subtle/50 px-3 py-2 text-xs"
          >
            <span className="font-mono font-semibold text-text-primary">{s.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-text-muted">
              — ms
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}