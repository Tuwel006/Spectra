import * as React from "react";

import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Static section data (TODOs)                                         */
/* ------------------------------------------------------------------ */

type MethodKey = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const PINNED_ITEMS: readonly { method: MethodKey; path: string }[] = [
  { method: "GET", path: "/users/{id}" },
  { method: "POST", path: "/auth/login" },
  { method: "GET", path: "/dashboard/stats" },
];
// TODO: replace with real favorites from a store.

export const RECENT_ITEMS: readonly { method: MethodKey; path: string; ago: string }[] = [
  { method: "GET", path: "/orders/{id}", ago: "2m ago" },
  { method: "GET", path: "/products", ago: "15m ago" },
  { method: "POST", path: "/users", ago: "1h ago" },
];
// TODO: replace with real recent-history from a store.

/* ------------------------------------------------------------------ */
/* Pinned list                                                         */
/* ------------------------------------------------------------------ */

export function PinnedList(): React.ReactElement {
  return (
    <div role="group" className="flex flex-col">
      {PINNED_ITEMS.map((item, idx) => (
        <StaticMethodRow
          key={`pinned-${item.method}-${item.path}-${idx}`}
          method={item.method}
          path={item.path}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent list                                                         */
/* ------------------------------------------------------------------ */

export function RecentList(): React.ReactElement {
  return (
    <div role="group" className="flex flex-col">
      {RECENT_ITEMS.map((item, idx) => (
        <StaticMethodRow
          key={`recent-${item.method}-${item.path}-${idx}`}
          method={item.method}
          path={item.path}
          trailing={item.ago}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

function StaticMethodRow({
  method,
  path,
  trailing,
}: {
  method: MethodKey;
  path: string;
  /** Optional right-aligned muted text (e.g. "2m ago"). */
  trailing?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-2 py-1 pr-3 text-left",
        "text-xs text-text-secondary",
        "transition-colors hover:bg-bg-muted focus:outline-none focus-visible:bg-bg-muted",
      )}
      style={{ paddingLeft: 20 }}
    >
      <MethodBadge method={method} size="xs" className="shrink-0" />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-mono text-[11px] text-text-primary">
          {path}
        </span>
        {trailing ? (
          <span className="ml-auto shrink-0 text-[10px] text-text-muted">
            {trailing}
          </span>
        ) : null}
      </span>
    </button>
  );
}