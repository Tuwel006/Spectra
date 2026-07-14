"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Toolbar above the workspace body.
 *
 * Hosts only the AI Assistant trigger — the sidebar collapse controls
 * live inside the sidebars themselves (Explorer header on the left,
 * RightSidebar header on the right) so they're always attached to
 * the panel they control.
 */
export function WorkspaceHeader(): React.ReactElement {
  const { rightCollapsed, toggleRight } = useLayout();

  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-b border-border bg-bg-subtle px-2",
      )}
    >
      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onClick={toggleRight}
        aria-pressed={!rightCollapsed}
        className={cn(!rightCollapsed && "bg-accent-subtle text-accent")}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Assistant
      </Button>
    </div>
  );
}