"use client";

import * as React from "react";
import { Hexagon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        "flex h-12 shrink-0 items-center gap-3 border-b border-border bg-bg-subtle px-3",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 pr-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg">
          <Hexagon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          Spectra Studio
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Workspace selector placeholder */}
      <Button variant="ghost" size="sm" className="gap-2">
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
      </Button>

      {/* Global search */}
      <div className="ml-2 flex max-w-xl flex-1 items-center">
        <Input
          variant="search"
          placeholder="Search endpoints, tags, schemas…"
          aria-label="Global search"
          trailingIcon={
            <kbd className="hidden rounded border border-border bg-bg-muted px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
              ⌘K
            </kbd>
          }
        />
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <ThemeToggle />
    </header>
  );
}