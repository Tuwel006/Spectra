"use client";

import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  readonly orientation?: "horizontal" | "vertical";
}

/**
 * Visual divider. Defaults to a 1px line that blends with the border colour.
 */
export function Separator({
  orientation = "horizontal",
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}