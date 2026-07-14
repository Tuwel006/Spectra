import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import type { SpinnerProps } from "./Spinner.types";

const sizeMap: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

/**
 * Animated loading spinner built on top of `lucide-react`'s `Loader2`.
 *
 * Pure CSS animation — no JS frame loop.
 */
export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex", className)}>
      <Loader2 className={cn(sizeMap[size], "animate-spin text-text-muted")} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}