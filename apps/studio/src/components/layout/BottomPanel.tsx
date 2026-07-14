"use client";

import * as React from "react";
import { ChevronUp, ChevronDown, Terminal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Bottom panel — collapsed by default.
 *
 * Future-use only: response console, environment variables, logs and
 * timeline will live here. Today this is a thin strip with a single
 * toggle that expands into a placeholder body.
 */
export function BottomPanel(): React.ReactElement {
  const { bottomOpen, toggleBottom } = useLayout();

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col border-t border-border bg-bg-subtle",
      )}
    >
      <button
        type="button"
        onClick={toggleBottom}
        aria-expanded={bottomOpen}
        aria-label={bottomOpen ? "Collapse bottom panel" : "Expand bottom panel"}
        className={cn(
          "flex h-7 w-full items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted hover:bg-bg-muted hover:text-text-secondary transition-colors",
        )}
      >
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3 w-3" />
          Console
          <Badge tone="subtle" size="xs" className="ml-1">TODO</Badge>
        </div>
        {bottomOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>

      {bottomOpen && <BottomPanelBody />}
    </div>
  );
}

/**
 * Placeholder body for the bottom panel. Exported separately so
 * `AppLayout` can render it inside a resizable `Panel` while keeping
 * the always-visible strip rendered as `BottomPanel`.
 */
export function BottomPanelBody(): React.ReactElement {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center px-4 py-6">
      <p className="text-center text-xs leading-relaxed text-text-muted">
        Response console, environment variables and logs will live here.
        <br />
        <span className="opacity-70">Future phase — no business logic yet.</span>
      </p>
    </div>
  );
}