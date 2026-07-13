"use client";

import * as React from "react";
import { Hexagon, Search } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/cn";

/**
 * Fixed-height top bar.
 *
 * Renders layout-only affordances:
 *  - brand logo + workspace name placeholder
 *  - global search input (placeholder, no behaviour)
 *  - theme switcher (Light / Dark / System, persisted)
 *
 * No business logic.
 */
export function TopBar(): React.ReactElement {
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-3 border-b",
        "border-[--color-border] bg-[--color-bg-subtle] px-3",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 pr-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-[--color-accent] text-[--color-accent-fg]">
          <Hexagon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-[--color-text-primary]">
          Spectra Studio
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-[--color-border]" />

      {/* Workspace selector placeholder */}
      <button
        type="button"
        className={cn(
          "inline-flex h-7 items-center gap-2 rounded-md px-2 text-xs font-medium",
          "text-[--color-text-secondary] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
          "transition-colors",
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        My Workspace
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="h-3.5 w-3.5 opacity-60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 8 4 4 4-4" />
        </svg>
      </button>

      {/* Global search */}
      <div className="ml-2 flex max-w-xl flex-1 items-center">
        <label
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md border",
            "border-[--color-border] bg-[--color-bg-base] px-2.5",
            "text-xs text-[--color-text-muted] focus-within:border-[--color-accent]",
            "transition-colors",
          )}
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          <input
            type="search"
            placeholder="Search endpoints, tags, schemas…"
            className="h-full w-full bg-transparent text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none"
            aria-label="Global search"
          />
          <kbd className="hidden rounded border border-[--color-border] px-1.5 py-0.5 font-mono text-[10px] text-[--color-text-muted] sm:inline">
            ⌘K
          </kbd>
        </label>
      </div>

      {/* Spacer pushes theme toggle to the right */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}