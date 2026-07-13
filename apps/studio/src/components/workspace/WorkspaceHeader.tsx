"use client";

import * as React from "react";
import { PanelLeft, PanelRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Toolbar above the workspace body. Mirrors the layout store's
 * left/right collapse state and exposes the AI Assistant trigger that
 * the design reference shows in the same row.
 */
export function WorkspaceHeader(): React.ReactElement {
  const {
    leftCollapsed,
    rightCollapsed,
    toggleLeft,
    toggleRight,
  } = useLayout();

  return (
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
  );
}
