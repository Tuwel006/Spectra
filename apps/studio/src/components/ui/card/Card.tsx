import * as React from "react";
import { cn } from "@/lib/cn";
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from "./Card.types";

const padMap: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

/**
 * Generic surface container. Composes with `CardHeader`, `CardBody`,
 * `CardFooter`, `CardTitle` and `CardDescription`.
 */
export function Card({
  bordered = true,
  padding = "none",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-bg-base",
        bordered && "border border-border",
        padMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn("text-sm font-semibold text-text-primary", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn("text-xs text-text-muted", className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={cn("px-4 py-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border px-4 py-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}