import * as React from "react";
import { Inbox } from "lucide-react";

/**
 * Empty states for the explorer. Two flavours:
 *   • `query` is undefined → "no documentation loaded"
 *   • `query` is a string → "no results"
 */
export function ExplorerEmpty({
  query,
}: {
  query?: string;
}): React.ReactElement {
  if (query && query.length > 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <Inbox className="h-5 w-5 text-text-muted" aria-hidden="true" />
        <p className="text-xs font-medium text-text-secondary">
          No matching endpoints
        </p>
        <p className="text-[11px] leading-relaxed text-text-muted">
          Try a different keyword or clear the search.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <Inbox className="h-5 w-5 text-text-muted" aria-hidden="true" />
      <p className="text-xs font-medium text-text-secondary">
        No API loaded
      </p>
      <p className="text-[11px] leading-relaxed text-text-muted">
        Connect a documentation source to start exploring.
      </p>
    </div>
  );
}
