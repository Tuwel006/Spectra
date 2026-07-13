"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/cn";

// Use the built-in Tooltip via inline implementation (no additional Radix dep needed)
// We implement a lightweight CSS-only tooltip for minimal bundle size.

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  delayMs?: number;
}

/**
 * Lightweight tooltip wrapper using a CSS-based approach.
 * Wraps children in a relative container and shows the content on hover/focus.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const sideClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <span className="relative inline-flex group/tooltip items-center">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1",
          "text-xs font-medium text-[--color-text-primary] bg-[--color-bg-elevated]",
          "border border-[--color-border] shadow-lg",
          "opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150",
          sideClasses[side],
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
