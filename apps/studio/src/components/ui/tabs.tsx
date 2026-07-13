"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface SegmentedProps<T extends string> {
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly options: ReadonlyArray<{ readonly id: T; readonly label: ReactNode }>;
  readonly size?: "sm" | "md";
  readonly className?: string;
}

/**
 * Segmented control used for the endpoint sub-tabs (Overview / Parameters / …).
 * Stateful but controlled — the parent owns the active value.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: SegmentedProps<T>) {
  const sizeClass = size === "sm" ? "h-7 text-xs" : "h-8 text-sm";

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-bg-muted p-0.5",
        sizeClass,
        className,
      )}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={cn(
              "flex h-full items-center rounded px-2.5 font-medium transition-colors",
              active
                ? "bg-bg-base text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}