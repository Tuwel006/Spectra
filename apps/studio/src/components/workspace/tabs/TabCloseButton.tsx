import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Close button rendered at the right edge of a tab. Always visible on
 * the active tab and on hover otherwise; the parent decides the
 * visibility via `force` for the inevitable middle-click case.
 */
export function TabCloseButton({
  onClick,
  ariaLabel,
  className,
  force = false,
}: {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ariaLabel: string;
  className?: string;
  /** Show the button even when the tab isn't active or hovered. */
  force?: boolean;
}): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm",
        "text-text-muted hover:bg-bg-muted hover:text-text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        "transition-opacity",
        // Hidden by default in inactive tabs. The parent `<EndpointTab>`
        // exposes a `data-active` attribute we target via class group.
        "opacity-0 group-hover/tab:opacity-100 group-focus-within/tab:opacity-100",
        "data-[show=true]:opacity-100",
        className,
      )}
      data-show={force || undefined}
    >
      <X className="h-3 w-3" aria-hidden="true" />
    </button>
  );
}
