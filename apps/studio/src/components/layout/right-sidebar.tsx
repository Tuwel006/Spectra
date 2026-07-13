"use client";

import { Sparkles } from "lucide-react";

import { useLayoutStore } from "@/store/layout-store";
import { AiPanelNav } from "@/features/endpoint/ai-panel-nav";
import { AiPanelContent } from "@/features/endpoint/ai-panel-content";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Right sidebar — collapsed by default.
 *
 * Hosts the AI panel placeholders. Provides a toggle button in the centre
 * rail so users can collapse it back to a thin strip.
 */
export function RightSidebar() {
  const collapsed = useLayoutStore((state) => state.rightCollapsed);
  const toggle = useLayoutStore((state) => state.toggleRightSidebar);

  if (collapsed) {
    return (
      <aside
        aria-label="AI assistant"
        className="flex h-full w-10 shrink-0 flex-col items-center border-l border-border bg-bg-subtle py-2"
      >
        <Tooltip content="Open AI panel" side="left">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Open AI panel"
            onClick={toggle}
          >
            <Sparkles className="size-4" />
          </Button>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside
      aria-label="AI assistant"
      className="flex h-full flex-col border-l border-border bg-bg-base"
    >
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-accent" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            AI
          </span>
        </div>
        <Tooltip content="Collapse panel">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Collapse panel"
            onClick={toggle}
          >
            <Sparkles className="size-3.5" />
          </Button>
        </Tooltip>
      </header>
      <AiPanelNav />
      <div className="flex-1 overflow-hidden">
        <AiPanelContent />
      </div>
    </aside>
  );
}