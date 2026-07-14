"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import {
  familyOf,
  isDefaultResponse,
  isSuccess,
  statusTone,
  type ResponseEntry,
} from "./response.types";

/**
 * Banner above the response body. Shows the selected status code,
 * description and any high-level metadata (success indicator, default
 * response flag, schema name).
 */
export function ResponseHeader({
  entry,
}: {
  entry: ResponseEntry | undefined;
}): React.ReactElement {
  if (!entry) {
    return (
      <div className="flex h-14 items-center gap-2 border-b border-border bg-bg-subtle px-4 text-xs italic text-text-muted">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        Select a status code to inspect the response.
      </div>
    );
  }

  const { status, response } = entry;
  const success = isSuccess(status);
  const isDefault = isDefaultResponse(status);
  const fam = familyOf(status);
  const tone = statusTone(status);
  const contentType = firstContentType(entry);

  return (
    <div className="flex flex-col gap-2 border-b border-border bg-bg-subtle px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone} size="md" className="font-mono">
          {status}
        </Badge>
        <span className="text-xs font-semibold text-text-primary">
          {familyTitle(fam)}
        </span>
        {success ? (
          <Badge tone="success" size="sm">
            Success
          </Badge>
        ) : null}
        {isDefault ? (
          <Badge tone="subtle" size="sm">
            Default
          </Badge>
        ) : null}
        {entry.schemaName ? (
          <Badge tone="accent" size="sm" className="font-mono">
            {entry.schemaName}
          </Badge>
        ) : null}
        {contentType ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {contentType}
          </span>
        ) : null}
      </div>
      {response.description ? (
        <p
          className={cn(
            "max-w-3xl text-xs leading-relaxed",
            success ? "text-text-secondary" : "text-text-secondary",
          )}
        >
          {response.description}
        </p>
      ) : (
        <p className="text-[11px] italic text-text-muted">
          No description provided.
        </p>
      )}
    </div>
  );
}

function familyTitle(family: ReturnType<typeof familyOf>): string {
  switch (family) {
    case "2xx":
      return "Successful response";
    case "3xx":
      return "Redirection";
    case "4xx":
      return "Client error";
    case "5xx":
      return "Server error";
    case "1xx":
      return "Informational";
    default:
      return "Default response";
  }
}

function firstContentType(entry: ResponseEntry): string | undefined {
  const body = entry.response.body;
  if (!body) return undefined;
  return Object.keys(body.content)[0];
}