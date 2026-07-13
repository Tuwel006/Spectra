"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

import {
  familyOf,
  statusTone,
  type ResponseEntry,
} from "./response.types";

/**
 * Horizontal scrollable strip of status-code chips. One chip per
 * documented response. Selecting a chip fires `onSelect` with the
 * status code string.
 */
export function StatusTabs({
  responses,
  selected,
  onSelect,
}: {
  responses: readonly ResponseEntry[];
  selected: string | undefined;
  onSelect: (status: string) => void;
}): React.ReactElement {
  if (responses.length === 0) {
    return (
      <div className="flex h-9 items-center px-3 text-[11px] italic text-text-muted">
        No documented responses.
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Response status codes"
      className="flex h-9 items-center gap-1 overflow-x-auto border-b border-border bg-bg-subtle px-2"
    >
      {responses.map((entry) => (
        <StatusChip
          key={entry.status}
          status={entry.status}
          description={entry.response.description}
          active={selected === entry.status}
          onClick={() => onSelect(entry.status)}
        />
      ))}
    </div>
  );
}

function StatusChip({
  status,
  description,
  active,
  onClick,
}: {
  status: string;
  description: string | undefined;
  active: boolean;
  onClick: () => void;
}): React.ReactElement {
  const tone = statusTone(status);
  const fam = familyOf(status);
  const toneClasses = toneChipClasses(tone, active);

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls="response-panel"
      aria-label={`Status ${status}${description ? ` — ${description}` : ""}`}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[11px] font-mono font-semibold transition-colors",
        toneClasses,
      )}
    >
      <span aria-hidden="true">{status}</span>
      <span
        className={cn(
          "hidden font-sans text-[10px] font-medium tracking-wide md:inline",
          active ? "opacity-90" : "opacity-60",
        )}
      >
        {familyLabel(fam)}
      </span>
    </button>
  );
}

function toneChipClasses(
  tone: ReturnType<typeof statusTone>,
  active: boolean,
): string {
  if (active) {
    switch (tone) {
      case "success":
        return "bg-status-2xx/15 text-status-2xx ring-1 ring-status-2xx/40";
      case "warning":
        return "bg-status-4xx/15 text-status-4xx ring-1 ring-status-4xx/40";
      case "danger":
        return "bg-status-5xx/15 text-status-5xx ring-1 ring-status-5xx/40";
      case "info":
        return "bg-status-3xx/15 text-status-3xx ring-1 ring-status-3xx/40";
      default:
        return "bg-bg-muted text-text-primary ring-1 ring-border-strong";
    }
  }
  switch (tone) {
    case "success":
      return "text-status-2xx hover:bg-status-2xx/10";
    case "warning":
      return "text-status-4xx hover:bg-status-4xx/10";
    case "danger":
      return "text-status-5xx hover:bg-status-5xx/10";
    case "info":
      return "text-status-3xx hover:bg-status-3xx/10";
    default:
      return "text-text-secondary hover:bg-bg-muted";
  }
}

function familyLabel(family: ReturnType<typeof familyOf>): string {
  switch (family) {
    case "2xx":
      return "Success";
    case "3xx":
      return "Redirect";
    case "4xx":
      return "Client Error";
    case "5xx":
      return "Server Error";
    case "1xx":
      return "Informational";
    default:
      return "Default";
  }
}