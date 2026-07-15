"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";

import { MethodBadge } from "@/components/ui/badge";
import { useWorkspaceStore } from "@/components/workspace";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Pinned list — derived from the workspace store                      */
/* ------------------------------------------------------------------ */

/**
 * Renders the workspace's pinned tabs inside the Explorer.
 *
 * Pinned tabs live in the workspace store; the Explorer doesn't own
 * them. We subscribe via `useWorkspaceStore` so a `togglePin` from the
 * tab strip immediately updates this list — no manual refresh.
 *
 * Uses `useShallow` so the filtered array reference is stable across
 * renders. Without it, `s.tabs.filter(...)` returns a new array on
 * every selector call and Zustand's `Object.is` snapshot check loops
 * forever ("Maximum update depth exceeded").
 */
export function PinnedList(): React.ReactElement {
  const pinnedTabs = useWorkspaceStore(
    useShallow((s) => s.tabs.filter((t) => t.pinned)),
  );

  if (pinnedTabs.length === 0) {
    return (
      <div
        role="group"
        className="flex flex-col px-5 py-3 text-[11px] italic leading-relaxed text-text-muted"
      >
        Pin an open tab to see it here.
      </div>
    );
  }

  return (
    <div role="group" className="flex flex-col">
      {pinnedTabs.map((tab) => {
        if (!tab.method || !tab.url) {
          // Skip non-endpoint tabs for now — the resource-type union
          // includes schema / response / …, none of which have an HTTP
          // method today.
          return null;
        }
        return (
          <StaticMethodRow
            key={tab.id}
            method={narrowMethod(tab.method)}
            path={tab.url}
            title={tab.title}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Recent list — derived from the workspace store                      */
/* ------------------------------------------------------------------ */

/**
 * Renders the most recently opened tabs in reverse chronological
 * order. The "Recently Opened" surface in the Explorer is read-only
 * today; the data flows from the workspace store.
 *
 * `useShallow` keeps the `s.tabs` snapshot stable so the downstream
 * `useMemo` doesn't re-derive on every render.
 */
export function RecentList(): React.ReactElement {
  const recentTabs = useWorkspaceStore(useShallow((s) => s.tabs));

  // Tabs are stored in insertion order. The most recent opens are at
  // the end of the list — reverse so the latest one is at the top.
  const ordered = React.useMemo(
    () => [...recentTabs].reverse().slice(0, 8),
    [recentTabs],
  );

  if (ordered.length === 0) {
    return (
      <div
        role="group"
        className="flex flex-col px-5 py-3 text-[11px] italic leading-relaxed text-text-muted"
      >
        Open an endpoint to see it here.
      </div>
    );
  }

  return (
    <div role="group" className="flex flex-col">
      {ordered.map((tab) => {
        if (!tab.method || !tab.url) return null;
        return (
          <StaticMethodRow
            key={tab.id}
            method={narrowMethod(tab.method)}
            path={tab.url}
            title={tab.title}
          />
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

/**
 * `MethodBadge` accepts a narrow subset of `HttpMethod` — TRACE and
 * CONNECT fall back to `OPTIONS` here so the badge stays renderable
 * for non-standard APIs without changing the row's appearance.
 */
function narrowMethod(
  method: Parameters<typeof MethodBadge>[0]["method"] | string,
): Parameters<typeof MethodBadge>[0]["method"] {
  switch (method) {
    case "GET":
    case "POST":
    case "PUT":
    case "PATCH":
    case "DELETE":
    case "HEAD":
    case "OPTIONS":
      return method;
    default:
      return "OPTIONS";
  }
}

function StaticMethodRow({
  method,
  path,
  title,
}: {
  method: Parameters<typeof MethodBadge>[0]["method"];
  path: string;
  /** Optional tooltip text — usually the tab summary. */
  title?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      title={title}
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
      </span>
    </button>
  );
}