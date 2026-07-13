import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton state. 12 placeholder rows give the explorer a sensible
 * vertical rhythm while real data is resolving. Triggers only when
 * upstream data is genuinely async — with the mock dataset this never
 * renders, but it's wired in for future providers.
 */
export function ExplorerLoading(): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 px-3 py-4" aria-busy="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          rounded="sm"
        />
      ))}
    </div>
  );
}
