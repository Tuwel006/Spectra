"use client";

import { cn } from "@/lib/cn";
import { statusClass } from "@/lib/http";

interface StatusPillProps {
  readonly status: number;
  readonly className?: string;
}

/**
 * Status code chip used in the explorer and responses panel.
 */
export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md border border-border bg-bg-subtle px-1.5 font-mono text-[10px] font-semibold",
        statusClass(status),
        className,
      )}
    >
      {status}
    </span>
  );
}