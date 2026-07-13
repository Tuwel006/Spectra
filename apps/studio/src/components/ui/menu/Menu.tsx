"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MenuProps } from "./Menu.types";

/**
 * Flat (non-grouped) action menu. Use {@link Dropdown} when items
 * should be split into labelled groups.
 */
export function Menu({ items, className, autoFocus = false }: MenuProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item && !item.disabled) item.onSelect?.();
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        "min-w-[12rem] rounded-md border border-border bg-bg-elevated p-1 shadow-lg outline-none",
        className,
      )}
    >
      {items.map((item, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onMouseEnter={() => setActiveIndex(idx)}
            onClick={() => !item.disabled && item.onSelect?.()}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-xs",
              "focus:outline-none",
              active && "bg-bg-muted",
              item.disabled && "cursor-not-allowed opacity-50",
              item.destructive ? "text-method-delete" : "text-text-primary",
            )}
          >
            <span className="flex items-center gap-2">
              <span className="grid h-3.5 w-3.5 place-items-center text-text-muted">
                {item.checked ? <Check className="h-3 w-3" aria-hidden /> : item.icon ?? null}
              </span>
              {item.label}
            </span>
            {item.shortcut && (
              <kbd className="rounded border border-border bg-bg-base px-1 font-mono text-[10px] text-text-muted">
                {item.shortcut}
              </kbd>
            )}
          </button>
        );
      })}
    </div>
  );
}