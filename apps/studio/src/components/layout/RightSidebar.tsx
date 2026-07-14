"use client";

import * as React from "react";
import {
  AlertTriangle,
  Code2,
  FlaskConical,
  MoreHorizontal,
  PanelRightClose,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { useLayout } from "@/store/layout";

/**
 * Right sidebar — AI Assistant host.
 *
 * Layout (Postman-inspired):
 *   ┌──────────────────────────────────────┐
 *   │ ✨ AI Assistant            [⋯] [✕]    │
 *   ├──────────────────────────────────────┤
 *   │ How can I help you today?            │
 *   │  [✨ Explain this endpoint]          │
 *   │  [⌘ Generate SDK]                    │
 *   │  [⚗ Generate tests]                 │
 *   │  [⚠ Find potential issues]          │
 *   │  [✦ Suggest improvements]           │
 *   └──────────────────────────────────────┘
 *
 * Each action is a stub — TODOs mark the wiring that future work will
 * add once the AI subsystem lands.
 */
type AssistantAction = {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ReactNode;
};

const ASSISTANT_ACTIONS: readonly AssistantAction[] = [
  { id: "explain", label: "Explain this endpoint", icon: <Sparkles className="h-3.5 w-3.5" aria-hidden /> },
  { id: "sdk", label: "Generate SDK", icon: <Code2 className="h-3.5 w-3.5" aria-hidden /> },
  { id: "tests", label: "Generate tests", icon: <FlaskConical className="h-3.5 w-3.5" aria-hidden /> },
  { id: "issues", label: "Find potential issues", icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> },
  { id: "improve", label: "Suggest improvements", icon: <Wand2 className="h-3.5 w-3.5" aria-hidden /> },
];

export function RightSidebar(): React.ReactElement {
  const { toggleRight } = useLayout();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-bg-subtle",
        "border-l border-border",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-10 shrink-0 items-center justify-between gap-2",
          "border-b border-border px-3",
        )}
      >
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5",
            "bg-accent-subtle text-accent",
            "text-xs font-semibold uppercase tracking-wider",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          AI Assistant
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Assistant options" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Assistant options"
              onClick={() => undefined}
              className="h-6 w-6 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
            >
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            </Button>
            {/* TODO: open assistant options menu. */}
          </Tooltip>
          <Tooltip content="Collapse right panel" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Collapse right panel"
              onClick={toggleRight}
              className="h-6 w-6 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
            >
              <PanelRightClose className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <p className="text-xs text-text-secondary">
          How can I help you today?
        </p>
        <div className="flex flex-col gap-1.5">
          {ASSISTANT_ACTIONS.map((action) => (
            <AssistantActionButton key={action.id} action={action} />
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/* Inline helper                                                       */
/* ------------------------------------------------------------------ */

function AssistantActionButton({
  action,
}: {
  action: AssistantAction;
}): React.ReactElement {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => undefined}
      className="h-8 w-full justify-start gap-2"
    >
      <span className="text-text-muted">{action.icon}</span>
      <span>{action.label}</span>
      {/* TODO: wire {action.id} to its assistant handler. */}
    </Button>
  );
}