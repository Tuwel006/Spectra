import type { HTMLAttributes } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Falls back to initials when missing or fails to load. */
  readonly src?: string;
  /** Name used to compute fallback initials. */
  readonly name?: string;
  readonly size?: AvatarSize;
  /** Custom fallback when both `src` and `name` are absent. */
  readonly fallback?: string;
}