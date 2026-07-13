"use client";

import * as React from "react";
import { Sparkles, PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Centre workspace — empty state for Phase 1.
 *
 * Layout-only. The endpoint tester, response viewer, tabs and request
 * panels will arrive in later phases. This view renders a placeholder
 * empty state plus the toolbar buttons that toggle the side rails.
 */
export function MainWorkspace(): React.ReactElement {
  const { leftCollapsed, rightCollapsed, bottomOpen, toggleLeft, toggleRight, toggleBottom } =
    useLayout();

  return (
    <section className="flex h-full flex-col overflow-hidden bg-[--color-bg-base]">
      {/* Toolbar */}
      <div
        className={cn(
          "flex h-9 shrink-0 items-center gap-1 border-b",
          "border-[--color-border] bg-[--color-bg-subtle] px-2",
        )}
      >
        <ToolbarButton
          ariaLabel={leftCollapsed ? "Open sidebar" : "Close sidebar"}
          onClick={toggleLeft}
          active={!leftCollapsed}
        >
          <PanelLeft className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          ariaLabel={rightCollapsed ? "Open right panel" : "Close right panel"}
          onClick={toggleRight}
          active={!rightCollapsed}
        >
          <PanelRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        <button
          type="button"
          onClick={toggleRight}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium",
            "text-[--color-text-secondary] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
            "transition-colors",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Assistant
        </button>
      </div>

      {/* Empty state body */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <div
            className={cn(
              "mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl",
              "border border-[--color-border] bg-[--color-bg-subtle]",
            )}
          >
            <Sparkles className="h-5 w-5 text-[--color-accent]" />
          </div>
          <h2 className="text-sm font-semibold text-[--color-text-primary]">
            Welcome to Spectra Studio
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[--color-text-muted]">
            Select an endpoint from the explorer to begin testing.
            <br />
            <span className="opacity-70">TODO: render endpoint tester &amp; response viewer.</span>
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[--color-text-disabled]">
            {`workspace · bottom=${bottomOpen ? "open" : "closed"}`}
          </p>
        </div>
      </div>
    </section>
  );
}

interface ToolbarButtonProps {
  readonly ariaLabel: string;
  readonly onClick: () => void;
  readonly active: boolean;
  readonly children: React.ReactNode;
}

function ToolbarButton({ ariaLabel, onClick, active, children }: ToolbarButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-[--color-text-secondary] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]",
        "transition-colors",
        active && "bg-[--color-accent-subtle] text-[--color-accent]",
      )}
    >
      {children}
    </button>
  );
}