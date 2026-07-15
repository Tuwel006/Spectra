"use client";

import * as React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Collapsible section primitive used by the endpoint workspace.
 *
 * Pure presentation — toggle state is owned by the parent and passed
 * in via `open` / `onToggle`. The chevron rotates smoothly on toggle
 * and the body slides via `data-state` so styles can drive a height
 * transition without measuring DOM.
 *
 * Used by Documentation, Request and Response panels.
 */
export function CollapsibleSection({
  id,
  title,
  open,
  onToggle,
  count,
  children,
  toolbar,
  className,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  /** Optional badge shown next to the section title. */
  count?: number;
  /** Optional right-aligned toolbar (sub-tabs, actions, …). */
  toolbar?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section
      className={cn(
        "flex flex-col border-b border-border last:border-b-0",
        className,
      )}
      aria-labelledby={`${id}-title`}
    >
      <header
        className={cn(
          "sticky top-0 z-10 flex h-9 shrink-0 items-center gap-1.5",
          "border-b border-border bg-bg-base px-4",
        )}
      >
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className={cn(
            "flex flex-1 items-center gap-1.5 text-left",
            "text-[11px] font-semibold uppercase tracking-wider text-text-secondary",
            "transition-colors hover:text-text-primary",
          )}
        >
          {open ? (
            <ChevronDown
              className="h-3 w-3 text-text-muted transition-transform"
              aria-hidden
            />
          ) : (
            <ChevronRight
              className="h-3 w-3 text-text-muted transition-transform"
              aria-hidden
            />
          )}
          <span id={`${id}-title`}>{title}</span>
          {typeof count === "number" && count > 0 ? (
            <span className="rounded-sm bg-bg-muted px-1.5 text-[9px] font-medium text-text-muted">
              {count}
            </span>
          ) : null}
        </button>
        {toolbar ? <div className="flex shrink-0 items-center gap-1">{toolbar}</div> : null}
      </header>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-title`}
        hidden={!open}
        className={cn("flex flex-col overflow-hidden", open ? "" : "h-0")}
      >
        {open ? children : null}
      </div>
    </section>
  );
}