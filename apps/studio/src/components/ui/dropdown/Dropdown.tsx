"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { DropdownProps, DropdownItem } from "./Dropdown.types";

/**
 * Dropdown menu — click trigger reveals a list of grouped actions.
 *
 * Click-outside, `Escape`, and `ArrowUp`/`ArrowDown` keyboard
 * navigation are handled here.
 */
export function Dropdown({
  trigger,
  groups,
  align = "start",
  side = "bottom",
  className,
}: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const flatItems = React.useMemo(
    () => groups.flatMap((g) => g.items),
    [groups],
  );

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (activeIndex >= flatItems.length) setActiveIndex(0);
  }, [activeIndex, flatItems.length]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(flatItems.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    }
  };

  const select = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    setOpen(false);
  };

  const position = cn(
    "absolute z-50 mt-1 min-w-[12rem] rounded-md border border-border bg-bg-elevated p-1 shadow-lg",
    side === "top" ? "bottom-full mb-1" : "top-full mt-1",
    align === "end" ? "right-0" : "left-0",
    className,
  );

  return (
    <div ref={wrapperRef} className="relative inline-block" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex"
      >
        {trigger}
      </button>
      {open && (
        <div role="menu" className={position}>
          {groups.map((group, groupIdx) => (
            <div key={group.id} className={cn(groupIdx > 0 && "mt-1 border-t border-border pt-1")}>
              {group.label && (
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
                  {group.label}
                </div>
              )}
              {group.items.map((item) => {
                const flatIdx = flatItems.indexOf(item);
                const active = flatIdx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    onClick={() => select(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-xs",
                      "focus:outline-none",
                      active && "bg-bg-muted",
                      item.disabled && "cursor-not-allowed opacity-50",
                      item.destructive ? "text-method-delete" : "text-text-primary",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon && <span aria-hidden>{item.icon}</span>}
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
          ))}
        </div>
      )}
    </div>
  );
}