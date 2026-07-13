"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { HttpMethod } from "@spectra/core";
import { HTTP_METHOD_CONFIG } from "@/constants";

interface MethodBadgeProps {
  method: HttpMethod;
  className?: string;
  /** compact — shows only the method, no padding; default shows full pill */
  compact?: boolean;
}

/**
 * Displays an HTTP method as a coloured pill badge.
 * Colours are pulled from the centralised HTTP_METHOD_CONFIG constants.
 */
export function MethodBadge({ method, className, compact = false }: MethodBadgeProps) {
  const cfg = HTTP_METHOD_CONFIG[method];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-mono font-bold uppercase tracking-wider",
        compact ? "text-[10px]" : "text-[11px] px-2 py-0.5",
        cfg.textClassName,
        cfg.bgClassName,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
