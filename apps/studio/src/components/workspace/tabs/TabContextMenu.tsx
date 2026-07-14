import * as React from "react";

import { cn } from "@/lib/cn";

export interface TabContextMenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly onSelect: () => void;
}

/**
 * Render-prop context menu. The visual chrome is identical across all
 * chrome-style tabs, so the menu itself is just a small anchored popover
 * driven by the host. Position is supplied by the parent (currently
 * bottom-left under the trigger; the layout reserves space for it).
 *
 * Kept tiny on purpose: the actual entries (`duplicate`, `pin`, …)
 * are supplied by the host so the same popover works for tabs and
 * future surfaces like the explorer row.
 */
export function TabContextMenu({
  open,
  items,
  onDismiss,
  className,
}: {
  open: boolean;
  items: readonly TabContextMenuItem[];
  onDismiss: () => void;
  className?: string;
}): React.ReactElement | null {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-orientation="vertical"
      className={cn(
        "absolute right-0 top-7 z-50 flex w-44 flex-col gap-0.5 rounded-md border border-border bg-bg-elevated p-1 shadow-lg",
        "animate-[explorer-section-open_120ms_ease-out]",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={() => {
            item.onSelect();
            onDismiss();
          }}
          className={cn(
            "flex h-7 items-center rounded-sm px-2 text-left text-xs",
            "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
