import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";
import type { BadgeProps, BadgeTone, HttpMethodColor } from "./Badge.types";

const badgeStyles = cva(
  "inline-flex items-center justify-center gap-1 rounded-md font-medium uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-bg-subtle text-text-secondary border border-border",
        subtle: "bg-bg-muted text-text-muted border border-transparent",
        accent: "bg-accent-subtle text-accent border border-accent/20",
        success: "bg-status-2xx/10 text-status-2xx border border-status-2xx/20",
        warning: "bg-status-3xx/10 text-status-3xx border border-status-3xx/20",
        danger: "bg-method-delete/10 text-method-delete border border-method-delete/20",
        info: "bg-method-put/10 text-method-put border border-method-put/20",
      },
      size: {
        xs: "text-[9px] px-1.5 py-0.5",
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

/** Maps HTTP method → Badge tone. Centralised so callers don't hardcode colours. */
export function methodTone(method: HttpMethodColor): BadgeTone {
  switch (method) {
    case "GET":     return "success";
    case "POST":    return "warning";
    case "PUT":     return "info";
    case "PATCH":   return "accent";
    case "DELETE":  return "danger";
    case "HEAD":    return "info";
    case "OPTIONS": return "subtle";
  }
}

/**
 * Generic badge primitive.
 *
 * Renders a small rounded pill. The `tone` controls the colour; `size`
 * controls the density. Use {@link MethodBadge} for HTTP methods.
 */
export function Badge({
  tone = "neutral",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeStyles({ tone, size }), className)} {...props}>
      {children}
    </span>
  );
}