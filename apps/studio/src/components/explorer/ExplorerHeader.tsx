import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * Sidebar-wide header strip.
 *
 * Layout (Postman-inspired):
 *   ┌─────────────────────────────────────────────────────┐
 *   │ APIs                                       [actions]│
 *   │ 37 Endpoints                                        │
 *   └─────────────────────────────────────────────────────┘
 *
 * The optional `actions` slot lets parent surfaces inject chrome
 * controls (collapse-all, view-mode switch, …) without coupling the
 * Explorer to layout concerns.
 */
export function ExplorerHeader({
  title,
  endpointCount,
  actions,
}: {
  title: string;
  /** Total endpoint count — rendered as a muted subtitle line. */
  endpointCount?: number;
  actions?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex h-12 shrink-0 flex-col justify-center gap-0.5 border-b border-border bg-bg-subtle px-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-text-primary">
          {title}
        </span>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1">{actions}</div>
        ) : null}
      </div>
      {typeof endpointCount === "number" ? (
        <span className={cn("text-[11px] font-medium text-text-muted")}>
          {endpointCount} {endpointCount === 1 ? "Endpoint" : "Endpoints"}
        </span>
      ) : null}
    </div>
  );
}