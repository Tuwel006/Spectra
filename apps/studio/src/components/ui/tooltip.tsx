"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface TooltipProps {
  readonly content: ReactNode;
  readonly children: ReactNode;
  readonly side?: "top" | "bottom" | "left" | "right";
  readonly className?: string;
}

/**
 * Lightweight CSS-only tooltip.
 *
 * Implemented without a portal because we don't currently render tooltips
 * over overflow:hidden surfaces. If that requirement changes, swap this for
 * `@radix-ui/react-tooltip` without touching consumers.
 */
export function Tooltip({
  content,
  children,
  side = "bottom",
  className,
}: TooltipProps) {
  const positionClass = {
    top: "bottom-full mb-1.5 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-1.5 left-1/2 -translate-x-1/2",
    left: "right-full mr-1.5 top-1/2 -translate-y-1/2",
    right: "left-full ml-1.5 top-1/2 -translate-y-1/2",
  }[side];

  return (
    <span className={cn("relative inline-flex group", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text-secondary opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          positionClass,
        )}
      >
        {content}
      </span>
    </span>
  );
}