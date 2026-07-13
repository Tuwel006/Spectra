"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly wrapperClassName?: string;
}

/**
 * Bare input field used inside search bars, header filters, etc.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, wrapperClassName, ...props },
  ref,
) {
  return (
    <div className={cn("relative flex w-full items-center", wrapperClassName)}>
      <input
        ref={ref}
        className={cn(
          "h-8 w-full rounded-md border border-border bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
});