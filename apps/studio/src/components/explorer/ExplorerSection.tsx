import * as React from "react";

import { cn } from "@/lib/cn";

import { ExplorerChevronIcon } from "./ExplorerIcons";

/**
 * Top-level collapsible section inside the explorer tree (API,
 * Components, Tags, …). The chevron rotates on toggle and the inner
 * content slides via a CSS height transition so it doesn't pop.
 */
export function ExplorerSection({
  id,
  title,
  count,
  open,
  onToggle,
  children,
  defaultIcon,
}: {
  id: string;
  title: string;
  /** Optional count badge shown next to the section title. */
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultIcon?: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="flex flex-col" aria-labelledby={`${id}-title`}>
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className={cn(
          "flex h-7 w-full shrink-0 items-center gap-1.5 px-2 text-left",
          "text-[11px] font-semibold uppercase tracking-wider text-text-secondary",
          "hover:bg-bg-muted",
        )}
      >
        <ExplorerChevronIcon
          open={open}
          className="h-3 w-3 shrink-0 text-text-muted"
        />
        {defaultIcon ? (
          <span className="shrink-0 text-text-muted">{defaultIcon}</span>
        ) : null}
        <span id={`${id}-title`} className="flex-1 truncate">
          {title}
        </span>
        {typeof count === "number" && count > 0 ? (
          <span className="shrink-0 rounded-sm px-1.5 text-[10px] font-medium text-text-muted">
            {count}
          </span>
        ) : null}
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-title`}
        hidden={!open}
        className="flex flex-col overflow-hidden"
      >
        {open ? children : null}
      </div>
    </section>
  );
}
