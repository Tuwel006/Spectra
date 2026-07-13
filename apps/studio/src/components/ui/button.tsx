"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/**
 * Visual variants for the primary `Button` primitive.
 * Kept declarative (class-variance-authority) so new variants can be added
 * without touching every consumer.
 */
const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base rounded-md",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary:
          "bg-bg-muted text-text-primary border border-border hover:bg-bg-subtle",
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-muted hover:text-text-primary",
        outline:
          "border border-border bg-transparent text-text-primary hover:bg-bg-muted",
        danger:
          "bg-method-delete/15 text-method-delete border border-method-delete/30 hover:bg-method-delete/25",
      },
      size: {
        xs: "h-6 px-2 text-xs",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-sm",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
        "icon-xs": "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonStyles({ variant, size }), className)}
        {...props}
      />
    );
  },
);