"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        default:  "bg-[--color-bg-muted] text-[--color-text-muted]",
        accent:   "bg-[--color-accent-subtle] text-[--color-accent]",
        success:  "bg-green-500/10 text-green-500",
        warning:  "bg-amber-500/10 text-amber-500",
        error:    "bg-red-500/10 text-red-500",
        info:     "bg-blue-500/10 text-blue-500",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = "Badge";
