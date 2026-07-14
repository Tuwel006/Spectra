"use client";

import * as React from "react";
import { PanelRightClose, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Right sidebar — placeholder.
 *
 * Will host the AI Assistant, analytics, logs and timeline views in
 * later phases. Today this is a layout-only panel with a close action
 * in its own header so the panel boundary is self-contained.
 */
export function RightSidebar(): React.ReactElement {
  const { toggleRight } = useLayout();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-[--color-bg-subtle]",
        "border-l border-[--color-border]",
      )}
    >
      <div
        className={cn(
          "flex h-9 shrink-0 items-center justify-between gap-2",
          "border-b border-[--color-border] px-3",
        )}
      >
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[--color-text-secondary]">
          <Sparkles className="h-3.5 w-3.5" />
          AI Assistant
        </div>
        <Tooltip content="Collapse right panel" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Collapse right panel"
            onClick={toggleRight}
            className="h-7 w-7 text-text-secondary hover:bg-accent-subtle hover:text-accent"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <p className="text-center text-xs leading-relaxed text-[--color-text-muted]">
          AI assistant, analytics and timeline will appear here.
          <br />
          <span className="opacity-70">Future phase — no business logic yet.</span>
        </p>
      </div>
    </aside>
  );
}