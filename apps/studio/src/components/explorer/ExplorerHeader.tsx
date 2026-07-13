import * as React from "react";
import { Hexagon } from "lucide-react";

import { ExplorerSparklesIcon } from "./ExplorerIcons";

/**
 * Static header strip. Shows the app name on the left and a small
 * metric on the right. Kept as its own component so the heavy
 * `<ExplorerTree>` can stay free of fixed chrome.
 */
export function ExplorerHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}): React.ReactElement {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg-subtle px-3">
      <div className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
        <Hexagon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
        <span className="truncate">{title}</span>
      </div>
      {subtitle ? (
        <div className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">
          <ExplorerSparklesIcon className="h-3 w-3" />
          <span>{subtitle}</span>
        </div>
      ) : null}
    </div>
  );
}
