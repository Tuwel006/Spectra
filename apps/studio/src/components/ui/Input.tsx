"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/** Input atom matching the design system palette. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-md border border-[--color-border] bg-[--color-bg-subtle]",
      "px-3 py-1.5 text-sm text-[--color-text-primary] placeholder:text-[--color-text-muted]",
      "transition-colors focus:border-[--color-accent] focus:outline-none focus:ring-1 focus:ring-[--color-accent]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
