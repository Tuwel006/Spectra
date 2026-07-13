"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import { ResponseCopy } from "./ResponseCopy";
import { ResponseDownload } from "./ResponseDownload";
import {
  RESPONSE_VIEW_LABEL,
  type ResponseViewMode,
} from "./response.types";

/**
 * Toolbar pinned to the top of the response body. Shows the current
 * view mode, search input (Pretty view), expand/collapse, copy and
 * download actions. Copy + Download operate on the supplied payload.
 */
export function ResponseToolbar({
  viewMode,
  body,
  raw,
  search,
  onSearchChange,
  expandedAll,
  onToggleExpanded,
  filename,
  contentType,
  disabled,
}: {
  viewMode: ResponseViewMode;
  body: unknown;
  raw: string;
  search: string;
  onSearchChange: (next: string) => void;
  expandedAll: boolean;
  onToggleExpanded: () => void;
  filename: string;
  contentType: string;
  disabled?: boolean;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-muted px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {RESPONSE_VIEW_LABEL[viewMode]}
      </span>

      {viewMode === "pretty" || viewMode === "raw" ? (
        <div className="relative ml-2 flex min-w-0 flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-2 h-3 w-3 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            placeholder="Search keys or values…"
            aria-label="Search response"
            className={cn(
              "h-6 w-full min-w-[120px] max-w-xs rounded-md border border-border bg-bg-base pl-7 pr-7 text-xs text-text-primary placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-accent/40",
            )}
          />
          {search.length > 0 ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
              className="absolute right-1.5 text-text-muted hover:text-text-primary"
              tabIndex={-1}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : (
        <span className="ml-2 text-[10px] uppercase tracking-wider text-text-muted">
          {disabled ? "No content" : "Read-only"}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        {viewMode === "pretty" ? (
          <Tooltip content={expandedAll ? "Collapse all" : "Expand all"}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={expandedAll ? "Collapse all nodes" : "Expand all nodes"}
              onClick={onToggleExpanded}
              disabled={disabled}
            >
              {expandedAll ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </Tooltip>
        ) : null}

        {viewMode === "raw" ? (
          <Tooltip content="Toggle word wrap (visual only — always on for now)">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Word wrap"
              disabled
            >
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <ChevronDown className="-ml-2 h-3.5 w-3.5 opacity-60" />
            </Button>
          </Tooltip>
        ) : null}

        <ResponseCopy value={raw} disabled={disabled} />

        <ResponseDownload
          value={raw}
          filename={filename}
          contentType={contentType}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Internal row items — used in non-pretty modes                         */
/* ------------------------------------------------------------------ */

export function ToolbarInfo({
  length,
  bytes,
}: {
  length: number;
  bytes: number;
}): React.ReactElement {
  return (
    <span className="ml-1 text-[10px] uppercase tracking-wider text-text-muted">
      {length.toLocaleString()} chars · {formatBytes(bytes)}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

/* ------------------------------------------------------------------ */
/* Re-export `Copy` icon so callers can override                         */
/* ------------------------------------------------------------------ */

export { Copy, Download };