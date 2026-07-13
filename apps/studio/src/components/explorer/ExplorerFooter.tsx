import * as React from "react";
import { Clock, Star } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Bottom strip inside the explorer. Shows a static count and two
 * "shortcut" hints for the favourites and recent panels above. The
 * real button affordances land once endpoint pages exist.
 */
export function ExplorerFooter({
  endpointCount,
  pathCount,
}: {
  endpointCount: number;
  pathCount: number;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-7 shrink-0 items-center justify-between gap-2",
        "border-t border-border bg-bg-subtle px-3 text-[10px]",
        "text-text-muted",
      )}
    >
      <span className="font-medium uppercase tracking-wider">
        {endpointCount} {endpointCount === 1 ? "endpoint" : "endpoints"}
      </span>
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center gap-1">
          <Star className="h-3 w-3" aria-hidden="true" />
          <span>{pathCount}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>0</span>
        </span>
      </div>
    </div>
  );
}
