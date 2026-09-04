"use client";

import * as React from "react";
import {
  Bell,
  ChevronDown,
  HelpCircle,
  Hexagon,
  PanelRightOpen,
  Settings as SettingsIcon,
  Sparkles,
  Star,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Single, full-width app header.
 *
 * Layout (Postman-inspired, left → right):
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │ [◇] Spectra Studio │ [MM API Workspace ▾] │ ⭐ Star 126 │ [search…] │
 *   │                                                  │ [● Development ▾] │
 *   │                                                  │ [?] [🔔] [⚙] [TS] │
 *   │                                                  │       [theme]    │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 * Every right-side control except the theme toggle and avatar opens a
 * stub dropdown / fires a no-op for now — TODOs mark where the real
 * handlers will plug in once the corresponding subsystem lands.
 *
 * Note on the dropdown triggers: the {@link Dropdown} primitive wraps
 * its `trigger` in a `<button>`, so we pass a plain `<button>` element
 * styled to match the {@link Button} `ghost` variant. Using the
 * `<Button>` component directly would produce `<button>` inside
 * `<button>` and trigger a React hydration warning.
 */
export function TopBar(): React.ReactElement {
  const { rightCollapsed, toggleRight } = useLayout();

  return (
    <header
      className={cn(
        "relative z-[60] flex h-12 min-w-0 shrink-0 items-center gap-2 border-b border-border bg-bg-subtle px-3",
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-2 pr-1">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-accent-fg">
          <Hexagon className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-text-primary">
          Spectra Studio
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Workspace selector */}
      <Dropdown
        align="start"
        trigger={
          <TriggerButton>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            MM API Workspace
            <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
          </TriggerButton>
        }
        groups={[
          {
            id: "workspace",
            label: "Workspaces",
            items: [
              {
                id: "ws-current",
                label: (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    MM API Workspace
                  </span>
                ),
              },
              { id: "ws-personal", label: "Personal Sandbox" },
              { id: "ws-shared", label: "Shared · Spectra Team" },
            ],
          },
        ]}
      />

      {/* Star button — total starred endpoints. */}
      <Tooltip content="View starred endpoints" side="bottom">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Star className="h-3.5 w-3.5" aria-hidden />
          Star
          <span className="text-text-muted">126</span>
          {/* TODO: replace with real starred-endpoint count from a store. */}
        </Button>
      </Tooltip>

      {/* Global search */}
      <div className="ml-2 flex min-w-0 max-w-xl flex-1 items-center">
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

      {/* Right cluster — wrapper pushes inner content to the end,
          inner holds the actual icon buttons. */}
      <div className="ml-auto flex shrink-0 items-center gap-1">
          {/* Environment selector */}
          <Dropdown
            align="end"
            trigger={
              <TriggerButton>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                Development
                <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
              </TriggerButton>
            }
            groups={[
              {
                id: "env",
                label: "Environment",
                items: [
                  {
                    id: "env-dev",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                        Development
                      </span>
                    ),
                  },
                  {
                    id: "env-staging",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                        Staging
                      </span>
                    ),
                  },
                  {
                    id: "env-prod",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden />
                        Production
                      </span>
                    ),
                  },
                  { id: "env-manage", label: "Manage environments…" },
                ],
              },
            ]}
          />

          <Tooltip
            content={rightCollapsed ? "Show AI Assistant" : "Hide AI Assistant"}
            side="bottom"
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle AI Assistant"
              aria-pressed={!rightCollapsed}
              onClick={toggleRight}
              className={cn(
                "h-7 w-7 shrink-0 transition-colors",
                !rightCollapsed
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
              )}
            >
              <Sparkles className="h-4 w-4" aria-hidden />
            </Button>
          </Tooltip>

          <TopBarIconButton
            icon={<HelpCircle className="h-4 w-4" aria-hidden />}
            label="Help"
          />
          {/* TODO: open help panel. */}

          <TopBarIconButton
            icon={<Bell className="h-4 w-4" aria-hidden />}
            label="Notifications"
          />
          {/* TODO: open notifications panel. */}

          <TopBarIconButton
            icon={<SettingsIcon className="h-4 w-4" aria-hidden />}
            label="Settings"
          />
          {/* TODO: open preferences. */}

          <Avatar name="TS" size="sm" fallback="TS" className="ml-1" />
          {/* TODO: open account menu. */}

          <ThemeToggle />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Inline helpers                                                       */
/* ------------------------------------------------------------------ */

/**
 * Visual chrome for a `Dropdown` trigger — a `<div>` shaped and styled
 * like the {@link Button} `ghost` variant. The Dropdown primitive wraps
 * this in its own `<button>` for click/keyboard semantics, so the
 * element itself must NOT be interactive.
 */
function TriggerButton({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5",
        "text-xs font-medium text-text-secondary",
        "transition-colors hover:bg-bg-muted hover:text-text-primary",
      )}
    >
      {children}
    </div>
  );
}

/**
 * Tiny icon-only TopBar button with a tooltip. Extracted so the three
 * help / notifications / settings controls stay one-liners.
 */
function TopBarIconButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}): React.ReactElement {
  return (
    <Tooltip content={label} side="bottom">
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
        className="h-7 w-7 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
      >
        {icon}
      </Button>
    </Tooltip>
  );
}