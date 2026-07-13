"use client";

import { Bell, Command, Search, Settings, Sparkles } from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { Kbd } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { GlobalSearch } from "@/components/navigation/global-search";
import { mockDocumentation } from "@/mock/documentation";

/**
 * Top navigation bar — workspace name, breadcrumb placeholder, search,
 * global command palette entry point, theme toggle, notifications, settings.
 *
 * Rendered once at the top of the application shell. Doesn't own layout
 * state itself; consumes the UI store to open the command palette.
 */
export function TopNav() {
  const openPalette = useUiStore((state) => state.openPalette);
  const workspaceName = mockDocumentation.name ?? "Workspace";

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-bg-base/95 px-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-fg">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Spectra Studio
          </span>
          <span className="text-sm font-semibold text-text-primary">
            {workspaceName}
          </span>
        </div>
      </div>

      <nav className="ml-2 hidden items-center gap-1 text-xs text-text-muted lg:flex">
        <span className="rounded px-1.5 py-0.5 hover:bg-bg-muted">File</span>
        <span className="rounded px-1.5 py-0.5 hover:bg-bg-muted">Edit</span>
        <span className="rounded px-1.5 py-0.5 hover:bg-bg-muted">View</span>
        <span className="rounded px-1.5 py-0.5 hover:bg-bg-muted">Run</span>
        <span className="rounded px-1.5 py-0.5 hover:bg-bg-muted">Help</span>
      </nav>

      <div className="ml-auto flex max-w-md flex-1 items-center">
        <GlobalSearch onOpenPalette={openPalette} />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Tooltip content="Command palette">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Open command palette"
            onClick={openPalette}
          >
            <Command className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Notifications">
          <Button size="icon-sm" variant="ghost" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
        </Tooltip>

        <ThemeToggle />

        <Tooltip content="Settings">
          <Button size="icon-sm" variant="ghost" aria-label="Settings">
            <Settings className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content="Profile">
          <button
            type="button"
            aria-label="Profile"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent"
          >
            AL
          </button>
        </Tooltip>
      </div>
    </header>
  );
}