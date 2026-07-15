"use client";

import * as React from "react";
import { Pin, X } from "lucide-react";

import { MethodBadge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import type { WorkspaceTab as WorkspaceTabData } from "./types/Workspace";

/**
 * Props for {@link WorkspaceTab}. Kept separate from the memoised
 * component so callers can type their callbacks without depending on
 * `React.memo`'s internal type.
 */
export interface WorkspaceTabProps {
  tab: WorkspaceTabData;
  active: boolean;
  onActivate: (tab: WorkspaceTabData) => void;
  onClose: (id: string) => void;
  onTogglePin: (id: string) => void;
}

/**
 * VS Code style tab.
 *
 * Visual states:
 *   • idle       — muted background, secondary text
 *   • hover      — slightly lighter background, primary text
 *   • active     — base background, primary text, accent underline
 *   • pinned     — `Pin` icon to the left of the method badge
 *   • dirty      — small dot before the close button
 *
 * Keyboard:
 *   • Enter / Space → activate
 *   • Middle-click → close (handled by `onAuxClick`)
 *
 * Memoised so an unrelated tab re-render (e.g. a scroll position
 * change) doesn't repaint every row in the strip.
 */
function WorkspaceTabInner({
  tab,
  active,
  onActivate,
  onClose,
  onTogglePin,
}: WorkspaceTabProps): React.ReactElement {
  const handleKey = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onActivate(tab);
      }
    },
    [tab, onActivate],
  );

  const handleAux = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.button === 1) {
        event.preventDefault();
        onClose(tab.id);
      }
    },
    [tab.id, onClose],
  );

  return (
    <div
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={active}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={active ? 0 : -1}
      onClick={() => onActivate(tab)}
      onKeyDown={handleKey}
      onAuxClick={handleAux}
      data-active={active || undefined}
      data-pinned={tab.pinned || undefined}
      className={cn(
        "group/tab relative flex h-8 max-w-[200px] min-w-[140px] flex-1 cursor-pointer items-center gap-1.5 border-r border-border px-2.5 text-left",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        active
          ? "bg-bg-base text-text-primary"
          : "bg-bg-muted text-text-secondary hover:bg-bg-subtle",
      )}
    >
      {tab.pinned ? (
        <Tooltip content="Pinned" side="bottom">
          <Pin
            className="h-3 w-3 shrink-0 text-accent"
            aria-label="Pinned"
          />
        </Tooltip>
      ) : null}

      {tab.method ? (
        <MethodBadge
          method={tab.method as Parameters<typeof MethodBadge>[0]["method"]}
          size="xs"
          className="shrink-0"
        />
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate font-mono text-[11px]",
            active ? "text-text-primary" : "text-text-secondary",
          )}
          title={tab.title}
        >
          {tab.title}
        </span>
      </span>

      {tab.dirty ? (
        <span
          aria-label="Unsaved changes"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
        />
      ) : null}

      <Tooltip content={tab.pinned ? "Unpin" : "Pin"} side="bottom">
        <button
          type="button"
          aria-label={tab.pinned ? "Unpin tab" : "Pin tab"}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(tab.id);
          }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
            "text-text-muted opacity-0 transition-opacity",
            "group-hover/tab:opacity-100 focus-visible:opacity-100",
            "hover:bg-bg-muted hover:text-text-primary",
          )}
        >
          <Pin className="h-3 w-3" aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip content="Close" side="bottom">
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onClose(tab.id);
          }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
            "text-text-muted opacity-0 transition-opacity",
            "group-hover/tab:opacity-100 focus-visible:opacity-100",
            "hover:bg-bg-muted hover:text-text-primary",
          )}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

export const WorkspaceTab = React.memo(WorkspaceTabInner);
WorkspaceTab.displayName = "WorkspaceTab";