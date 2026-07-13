"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface ScrollAreaProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly viewportClassName?: string;
}

/**
 * Drop-in replacement for native overflow containers.
 * Keeps the design tokens' scrollbar styling consistent across the app.
 */
export function ScrollArea({ children, className, viewportClassName }: ScrollAreaProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className={cn(
          "h-full w-full overflow-auto",
          viewportClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}