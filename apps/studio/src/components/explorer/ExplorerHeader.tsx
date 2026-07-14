import * as React from "react";
import { ChevronDown, Hexagon } from "lucide-react";

import type { Documentation } from "@spectra/core";

import { ExplorerSparklesIcon } from "./ExplorerIcons";

/**
 * Sidebar-wide header strip.
 *
 * Layout (VS Code inspired):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ [Hex]  Workspace ▾       Spectra · v1.4.2    [✕]   │
 *   └─────────────────────────────────────────────────────┘
 *
 * The optional `actions` slot lets parent surfaces inject chrome
 * controls (collapse button, theme toggle, …) without coupling the
 * Explorer to layout concerns.
 */
export function ExplorerHeader({
  title,
  subtitle,
  documentation,
  actions,
}: {
  title: string;
  subtitle?: string;
  /** Optional documentation source — drives the project + version lines. */
  documentation?: Pick<Documentation, "name" | "metadata" | "info">;
  actions?: React.ReactNode;
}): React.ReactElement {
  const projectName = documentation?.name ?? title;
  const version = documentation?.metadata?.version ?? documentation?.info?.version;
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg-subtle px-3">
      <button
        type="button"
        className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:text-text-primary"
        aria-label="Workspace selector"
      >
        <Hexagon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span className="truncate">{projectName}</span>
        <ChevronDown
          className="h-3 w-3 shrink-0 text-text-muted"
          aria-hidden="true"
        />
      </button>
      <div className="flex shrink-0 items-center gap-1.5">
        {version ? (
          <span className="rounded-sm bg-bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            v{version}
          </span>
        ) : null}
        {subtitle ? (
          <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
            <ExplorerSparklesIcon className="h-3 w-3" />
            <span>{subtitle}</span>
          </div>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
