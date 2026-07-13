"use client";

import type { HttpMethod } from "@spectra/core";

import { cn } from "@/lib/cn";
import { methodClass, methodLabel } from "@/lib/http";

interface MethodBadgeProps {
  readonly method: HttpMethod;
  readonly size?: "xs" | "sm" | "md";
  readonly className?: string;
}

/**
 * Coloured HTTP method chip — used everywhere a method is displayed
 * (explorer tree, tabs, endpoint header).
 */
export function MethodBadge({ method, size = "sm", className }: MethodBadgeProps) {
  const sizeClass =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5 min-w-[34px]"
      : size === "sm"
        ? "text-[10px] px-1.5 py-0.5 min-w-[40px]"
        : "text-xs px-2 py-1 min-w-[48px]";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded border font-semibold tracking-wide uppercase",
        methodClass(method),
        sizeClass,
        className,
      )}
    >
      {methodLabel(method)}
    </span>
  );
}