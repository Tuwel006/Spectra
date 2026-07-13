"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { TabsProps, TabPanelProps } from "./Tabs.types";

/**
 * Accessible tabs primitive. Renders the tab strip + an active-panel
 * outlet. The outlet is opt-in via {@link TabPanel} so callers can
 * place it anywhere in the layout.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  orientation = "horizontal",
  variant = "default",
  className,
}: TabsProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? items[0]?.id ?? "");
  const current = isControlled ? value ?? "" : internalValue;

  const select = (id: string) => {
    if (!isControlled) setInternalValue(id);
    onChange?.(id);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled);
    const idx = enabled.findIndex((i) => i.id === current);
    if (idx < 0) return;
    if (event.key === "ArrowRight" || (orientation === "vertical" && event.key === "ArrowDown")) {
      event.preventDefault();
      select(enabled[(idx + 1) % enabled.length]!.id);
    } else if (event.key === "ArrowLeft" || (orientation === "vertical" && event.key === "ArrowUp")) {
      event.preventDefault();
      select(enabled[(idx - 1 + enabled.length) % enabled.length]!.id);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(enabled[0]!.id);
    } else if (event.key === "End") {
      event.preventDefault();
      select(enabled[enabled.length - 1]!.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
      className={cn(
        orientation === "horizontal"
          ? "inline-flex items-center gap-1 border-b border-border"
          : "flex flex-col gap-1 border-r border-border",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === current;
        const baseClass =
          variant === "pills"
            ? "rounded-md px-3 py-1.5"
            : orientation === "horizontal"
              ? "-mb-px border-b-2 px-3 py-2"
              : "-mr-px border-r-2 px-3 py-2";

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`tabpanel-${item.id}`}
            id={`tab-${item.id}`}
            tabIndex={active ? 0 : -1}
            disabled={item.disabled}
            onClick={() => !item.disabled && select(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
              "disabled:cursor-not-allowed disabled:opacity-50",
              baseClass,
              active
                ? variant === "pills"
                  ? "bg-accent-subtle text-accent"
                  : "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:bg-bg-muted/50",
            )}
          >
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Conditional panel that only renders when its `value` matches the
 * currently active tab value. Pair with {@link Tabs}.
 */
export function TabPanel({ value, activeValue, keepMounted = false, children }: TabPanelProps) {
  const active = value === activeValue;
  if (!active && !keepMounted) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!active}
    >
      {children}
    </div>
  );
}