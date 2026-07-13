import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Use a circular radius (avatar-like). Defaults to rectangular. */
  readonly rounded?: "none" | "sm" | "md" | "lg" | "full";
}