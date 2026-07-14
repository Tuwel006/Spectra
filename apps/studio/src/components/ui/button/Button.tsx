"use client";

import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ButtonProps } from "./Button.types";

/**
 * Core `Button` primitive.
 *
 * Use `variant` to control emphasis and `size` to control density.
 * Icon-only buttons (`size="icon"`) must include an `aria-label`.
 */
const buttonStyles = cva(
  [
    "inline-flex items-center justify-center gap-2 font-medium select-none",
    "whitespace-nowrap rounded-md transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary: "bg-bg-muted text-text-primary border border-border hover:bg-bg-subtle",
        ghost: "bg-transparent text-text-secondary hover:bg-bg-muted hover:text-text-primary",
        outline: "border border-border bg-transparent text-text-primary hover:bg-bg-muted",
        danger: "bg-method-delete/15 text-method-delete border border-method-delete/30 hover:bg-method-delete/25",
      },
      size: {
        xs: "h-6 px-2 text-xs",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "secondary",
    size = "md",
    type = "button",
    loading = false,
    leadingIcon,
    trailingIcon,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const iconSize = size === "xs" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  return (
    <button
      ref={ref}
      type={type}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={cn(buttonStyles({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <Loader2 className={cn(iconSize, "animate-spin")} aria-hidden />
      ) : (
        leadingIcon
      )}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});