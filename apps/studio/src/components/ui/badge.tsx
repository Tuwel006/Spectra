"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface BadgeProps {
  readonly children: ReactNode;
  readonly variant?: "default" | "subtle" | "accent";
  readonly className?: string;
}

/**
 * Neutral badge primitive — used for counts, status text, etc.
 */
export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variantClass =
    variant === "accent"
      ? "bg-accent-subtle text-accent"
      : variant === "subtle"
        ? "bg-bg-muted text-text-muted"
        : "bg-bg-subtle text-text-secondary border border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        variantClass,
        className,
      )}
    >
      {children}
    </span>
  );
}