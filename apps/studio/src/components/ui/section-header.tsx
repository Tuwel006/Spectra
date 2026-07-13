"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface CollapsibleSectionProps {
  readonly title: ReactNode;
  readonly children: ReactNode;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly trailing?: ReactNode;
  readonly className?: string;
}

/**
 * Section header used in the Explorer — title, expand/collapse caret and
 * an optional trailing slot for action buttons.
 */
export function CollapsibleSection({
  title,
  children,
  expanded,
  onToggle,
  trailing,
  className,
}: CollapsibleSectionProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group flex h-6 w-full items-center gap-1.5 px-2 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-primary"
      >
        {expanded ? (
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-3 shrink-0" aria-hidden />
        )}
        <span className="truncate">{title}</span>
        {trailing ? (
          <span
            className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            {trailing}
          </span>
        ) : null}
      </button>
      {expanded ? <div className="flex flex-col">{children}</div> : null}
    </div>
  );
}