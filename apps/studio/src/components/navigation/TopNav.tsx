"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, ChevronDown, Star, Bell, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/cn";

interface TopNavProps {
  workspaceName?: string;
  onSearchClick?: () => void;
}

/**
 * Top navigation bar — always visible, full width.
 * Contains: logo, workspace switcher, search trigger, notifications, settings, profile.
 */
export function TopNav({ workspaceName = "E-Commerce API", onSearchClick }: TopNavProps) {
  return (
    <header
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 px-3",
        "border-b border-[--color-border]",
        "bg-[--color-bg-subtle]"
      )}
    >
      {/* Logo + brand */}
      <Link
        href="/"
        className="flex items-center gap-2 text-[--color-text-primary] mr-2 shrink-0"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[--color-accent]">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Spectra Studio</span>
      </Link>

      <div className="h-4 w-px bg-[--color-border] shrink-0" />

      {/* Workspace switcher */}
      <Button variant="ghost" size="sm" className="gap-1 font-medium max-w-44 truncate">
        <span className="truncate">{workspaceName}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[--color-text-muted]" />
      </Button>

      {/* Star count (decorative) */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-[--color-text-muted]">
        <Star className="h-3.5 w-3.5" />
        <span className="text-xs">Star · 126</span>
      </Button>

      {/* Search trigger */}
      <button
        onClick={onSearchClick}
        className={cn(
          "ml-auto flex h-7 items-center gap-2 rounded-md border border-[--color-border]",
          "bg-[--color-bg-muted] px-3 text-xs text-[--color-text-muted]",
          "transition-colors hover:bg-[--color-border] hover:text-[--color-text-primary]",
          "focus:outline-none focus:ring-2 focus:ring-[--color-accent]",
          "min-w-48 cursor-text"
        )}
        aria-label="Open search"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search endpoints, tags…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-[--color-border] bg-[--color-bg-elevated] px-1 py-0.5 text-[10px] font-medium sm:flex">
          <span>⌘</span><span>K</span>
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-0.5 ml-2">
        {/* Environment indicator */}
        <div className="hidden md:flex items-center gap-1.5 rounded-md border border-[--color-border] px-2.5 py-1 text-xs text-[--color-text-muted] mr-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Development
          <ChevronDown className="h-3 w-3" />
        </div>

        <Tooltip content="Notifications" side="bottom">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Settings" side="bottom">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </Tooltip>

        <ThemeToggle />

        {/* User avatar */}
        <button
          className={cn(
            "ml-1 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-[--color-accent] text-[10px] font-bold text-white",
            "ring-2 ring-transparent hover:ring-[--color-accent] transition-all"
          )}
          aria-label="User menu"
        >
          TS
        </button>
      </div>
    </header>
  );
}
