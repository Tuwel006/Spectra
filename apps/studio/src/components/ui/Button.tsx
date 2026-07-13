"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium",
    "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-[--color-accent] disabled:pointer-events-none disabled:opacity-40",
    "select-none cursor-pointer",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-[--color-accent] text-[--color-accent-fg] hover:bg-[--color-accent-hover]",
        secondary:
          "bg-[--color-bg-muted] text-[--color-text-secondary] hover:bg-[--color-border]",
        ghost:
          "text-[--color-text-secondary] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
        outline:
          "border border-[--color-border] text-[--color-text-secondary] hover:bg-[--color-bg-muted]",
        destructive:
          "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        link:
          "text-[--color-accent] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-6 px-2 text-xs",
        sm: "h-7 px-3 text-xs",
        md: "h-8 px-4 text-sm",
        lg: "h-9 px-5 text-sm",
        icon: "h-7 w-7 p-0",
        "icon-sm": "h-6 w-6 p-0",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
