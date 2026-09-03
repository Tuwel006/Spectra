"use client";

import * as React from "react";
import { ScrollText } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { AuthConfig } from "./request.types";

/* ------------------------------------------------------------------ */
/* Summary preview                                                     */
/* ------------------------------------------------------------------ */

export function SummaryPreview({
  auth,
}: {
  auth: AuthConfig;
}): React.ReactElement {
  const lines = describeAuth(auth);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-bg-subtle/60 p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          <ScrollText className="h-3 w-3" aria-hidden="true" />
          Effective header
        </span>
        <Badge tone="subtle" size="xs">
          preview
        </Badge>
      </div>
      {lines.length === 0 ? (
        <p className="font-mono text-[11px] text-text-muted">
          No Authorization header will be sent.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {lines.map((line, i) => (
            <li
              key={i}
              className="flex items-baseline gap-2 font-mono text-[11px] text-text-secondary"
            >
              <span className="text-text-muted">{line.label}</span>
              <span className="truncate text-text-primary">{line.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describeAuth(
  auth: AuthConfig,
): ReadonlyArray<{ label: string; value: string }> {
  const mask = (v?: string): string =>
    !v
      ? "—"
      : v.length <= 4
        ? "•".repeat(v.length)
        : "•".repeat(Math.min(v.length, 12));

  switch (auth.type) {
    case "no-auth":
      return [];
    case "bearer":
      return [{ label: "Authorization:", value: `Bearer ${mask(auth.token)}` }];
    case "basic":
      return [
        {
          label: "Authorization:",
          value: `Basic ${mask(auth.username ?? "")}:${mask(auth.password ?? "")}`,
        },
      ];
    case "apiKey":
      if (auth.apiKeyIn === "query") {
        return [
          {
            label: "Query:",
            value: `${auth.apiKeyName || "key"}=${mask(auth.apiKeyValue)}`,
          },
        ];
      }
      return [
        {
          label: "Header:",
          value: `${auth.apiKeyName || "X-API-Key"}: ${mask(auth.apiKeyValue)}`,
        },
      ];
    case "oauth2":
      return [{ label: "Authorization:", value: "OAuth 2.0 (scaffolded)" }];
    case "jwt":
      return [{ label: "Authorization:", value: `Bearer ${mask(auth.token)}` }];
  }
}