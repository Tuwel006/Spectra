"use client";

import * as React from "react";
import { Sparkles, PanelLeft, PanelRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { EmptyState } from "@/components/ui/empty-state";
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
    <section className="flex h-full flex-col overflow-hidden bg-bg-base">
      {/* Toolbar */}
      <div
        className={cn(
          "flex h-9 shrink-0 items-center gap-1 border-b border-border bg-bg-subtle px-2",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={leftCollapsed ? "Open sidebar" : "Close sidebar"}
          aria-pressed={!leftCollapsed}
          onClick={toggleLeft}
          className={cn(!leftCollapsed && "bg-accent-subtle text-accent")}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label={rightCollapsed ? "Open right panel" : "Close right panel"}
          aria-pressed={!rightCollapsed}
          onClick={toggleRight}
          className={cn(!rightCollapsed && "bg-accent-subtle text-accent")}
        >
          <PanelRight className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button variant="ghost" size="sm" onClick={toggleRight}>
          <Sparkles className="h-3.5 w-3.5" />
          AI Assistant
        </Button>
      </div>

      {/* Empty state body */}
      <EmptyState
        icon={<Icon icon={Sparkles} size="lg" className="text-accent" />}
        title="Welcome to Spectra Studio"
        description={
          <>
            Select an endpoint from the explorer to begin testing.
            <br />
            <span className="opacity-70">TODO: render endpoint tester &amp; response viewer.</span>
          </>
        }
      />

      <p className="px-4 pb-4 text-center font-mono text-[10px] uppercase tracking-wider text-text-disabled">
        {`workspace · bottom=${bottomOpen ? "open" : "closed"}`}
      </p>
    </section>
  );
}