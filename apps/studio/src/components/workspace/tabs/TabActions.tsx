import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Kebab trigger inside a tab. Opens a contextual menu with actions like
 * duplicate / pin / close-others. The menu itself is rendered by
 * {@link TabContextMenu} once the user opens it.
 *
 * Triggers on click only — no right-click conflict with the host tab.
 */
export function TabActions({
  onOpenMenu,
  ariaLabel,
}: {
  onOpenMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onOpenMenu(event);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
        "text-text-muted hover:bg-bg-muted hover:text-text-primary",
        "opacity-0 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
      )}
    >
      <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
