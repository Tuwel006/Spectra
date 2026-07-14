import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "subtle"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeSize = "xs" | "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly size?: BadgeSize;
  readonly children?: ReactNode;
}

/** HTTP methods that have a coloured variant in {@link Badge}. */
export type HttpMethodColor =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";