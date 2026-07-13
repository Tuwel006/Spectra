"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import type { SwitchProps } from "./Switch.types";

const trackSize: Record<NonNullable<SwitchProps["size"]>, string> = {
  sm: "h-4 w-7",
  md: "h-5 w-9",
};
const thumbSize: Record<NonNullable<SwitchProps["size"]>, string> = {
  sm: "h-3 w-3 translate-x-0.5 peer-checked:translate-x-[18px]",
  md: "h-4 w-4 translate-x-0.5 peer-checked:translate-x-[20px]",
};

/**
 * Toggle switch primitive. Built on a native checkbox so keyboard and
 * screen-reader semantics come for free.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, label, size = "md", disabled, checked, ...props },
  ref,
) {
  const input = (
    <span className={cn("relative inline-flex shrink-0 items-center", trackSize[size])}>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        disabled={disabled}
        checked={checked}
        className={cn(
          "peer sr-only",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full bg-bg-muted transition-colors",
          "peer-checked:bg-accent",
          "peer-disabled:opacity-50",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full bg-bg-base shadow transition-transform",
          thumbSize[size],
        )}
      />
    </span>
  );

  if (!label) return input;

  return (
    <label
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-2 text-sm text-text-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {input}
      <span>{label}</span>
    </label>
  );
});