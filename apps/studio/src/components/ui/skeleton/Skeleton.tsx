import { cn } from "@/lib/cn";
import type { SkeletonProps } from "./Skeleton.types";

const radiusMap: Record<NonNullable<SkeletonProps["rounded"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

/**
 * Shimmering placeholder block.
 *
 * Use to indicate content is loading without committing to a layout.
 */
export function Skeleton({ rounded = "md", className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse bg-bg-muted",
        radiusMap[rounded],
        className,
      )}
      {...props}
    />
  );
}