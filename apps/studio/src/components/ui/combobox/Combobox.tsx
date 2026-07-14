"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/cn";
import type { ComboboxOption, ComboboxProps } from "./Combobox.types";

/**
 * Searchable single-select combobox.
 *
 * Filters options in-place as the user types. Supports keyboard
 * navigation (`ArrowUp`/`ArrowDown`/`Enter`/`Escape`) and is rendered
 * with native listbox semantics.
 */
export function Combobox({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Search…",
  emptyMessage = "No matches",
  disabled = false,
  invalid = false,
  className,
  inline = false,
  name,
}: ComboboxProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value ?? "" : internalValue;

  const selected = options.find((o) => o.value === currentValue) ?? null;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  React.useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [activeIndex, filtered.length]);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  const commit = (option: ComboboxOption) => {
    if (option.disabled) return;
    if (!isControlled) setInternalValue(option.value);
    onChange?.(option.value);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      if (!open) return;
      const option = filtered[activeIndex];
      if (option) {
        event.preventDefault();
        commit(option);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  // Group options by `group` field (preserving order).
  const grouped = React.useMemo(() => {
    const map = new Map<string, ComboboxOption[]>();
    for (const option of filtered) {
      const key = option.group ?? "";
      const list = map.get(key) ?? [];
      list.push(option);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {name && <input type="hidden" name={name} value={currentValue} />}
      <div
        className={cn(
          "flex h-8 w-full items-center gap-2 rounded-md border bg-bg-base px-2.5 text-sm",
          "focus-within:ring-2 focus-within:ring-accent/40",
          invalid ? "border-method-delete" : "border-border",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <Search aria-hidden className="h-3.5 w-3.5 text-text-muted" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="combobox-listbox"
          aria-autocomplete="list"
          aria-activedescendant={filtered[activeIndex] ? `combobox-option-${filtered[activeIndex].value}` : undefined}
          disabled={disabled}
          placeholder={selected?.label ?? placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-full w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        <ChevronDown
          aria-hidden
          className={cn("h-3.5 w-3.5 text-text-muted transition-transform", open && "rotate-180")}
        />
      </div>

      {open && !disabled && (
        <div
          id="combobox-listbox"
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-bg-elevated shadow-lg",
            inline ? "" : "left-0 right-0",
          )}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-text-muted">{emptyMessage}</div>
          ) : (
            grouped.map(([groupName, items]) => (
              <div key={groupName || "_default"} className="py-1">
                {groupName && (
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-disabled">
                    {groupName}
                  </div>
                )}
                {items.map((option) => {
                  const flatIndex = filtered.indexOf(option);
                  return (
                    <div
                      key={option.value}
                      id={`combobox-option-${option.value}`}
                      role="option"
                      aria-selected={option.value === currentValue}
                      aria-disabled={option.disabled || undefined}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        commit(option);
                      }}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs",
                        flatIndex === activeIndex && "bg-bg-muted",
                        option.value === currentValue && "text-accent",
                        option.disabled && "cursor-not-allowed opacity-50",
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.description && (
                        <span className="ml-2 truncate text-text-muted">{option.description}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}