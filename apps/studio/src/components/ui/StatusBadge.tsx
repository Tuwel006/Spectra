"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { getStatusCodeConfig } from "@/constants";

interface StatusBadgeProps {
  code: string | number;
  className?: string;
}

/**
 * Renders an HTTP status code with the appropriate semantic colour.
 * 2xx → green | 3xx → amber | 4xx → orange | 5xx → red
 */
export function StatusBadge({ code, className }: StatusBadgeProps) {
  const numeric = typeof code === "string" ? parseInt(code, 10) : code;
  const cfg = getStatusCodeConfig(numeric);

  const bgMap: Record<string, string> = {
    "text-green-500":  "bg-green-500/10",
    "text-amber-500":  "bg-amber-500/10",
    "text-orange-500": "bg-orange-500/10",
    "text-red-500":    "bg-red-500/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono",
        cfg.className,
        bgMap[cfg.className],
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
