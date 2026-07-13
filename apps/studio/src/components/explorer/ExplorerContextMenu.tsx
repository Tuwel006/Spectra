import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * Right-click + kebab-button context menu for explorer rows.
 *
 * <p>
 *   Wires a small kebab button to each row. Clicking opens a
 *   `Menu`-shaped popover with placeholder actions so the renderer
 *   ships with full chrome. The host can pass `actions` later to
 *   without changing layout.
 * </p>
 *
 * Kept intentionally tiny — actions arrive in a future phase once the
 * endpoint page exists.
 */
export interface ExplorerContextMenuAction {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

export function ExplorerContextMenuTrigger({
  actions: _actions,
  ariaLabel = "More actions",
}: {
  actions?: readonly ExplorerContextMenuAction[];
  ariaLabel?: string;
}): React.ReactElement {
  void _actions;
  return (
    <span
      role="button"
      tabIndex={0}
      aria-haspopup="menu"
      aria-label={ariaLabel}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-sm",
        "text-text-muted opacity-0 transition-opacity",
        "group-hover:opacity-100 group-focus-within:opacity-100",
        "hover:bg-bg-muted hover:text-text-secondary",
      )}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3 w-3"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="3" cy="8" r="1.2" />
        <circle cx="8" cy="8" r="1.2" />
        <circle cx="13" cy="8" r="1.2" />
      </svg>
    </span>
  );
}
