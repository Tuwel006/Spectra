"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DrawerProps,
  DrawerHeaderProps,
  DrawerBodyProps,
  DrawerFooterProps,
} from "./Drawer.types";

const widthMap: Record<NonNullable<DrawerProps["width"]>, string> = {
  sm: "w-72",
  md: "w-96",
  lg: "w-[28rem]",
  xl: "w-[36rem]",
};

const positionMap: Record<NonNullable<DrawerProps["side"]>, string> = {
  right: "right-0 top-0 h-full",
  left: "left-0 top-0 h-full",
  top: "top-0 left-0 w-full max-h-[80vh]",
  bottom: "bottom-0 left-0 w-full max-h-[80vh]",
};

/**
 * Side drawer / sheet. Slides in from one of the four edges.
 *
 * - Renders into a portal at `document.body`.
 * - Locks body scroll while open.
 * - Dismisses on `Escape` and backdrop click (configurable).
 */
export function Drawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  side = "right",
  width = "md",
  className,
  dismissable = true,
}: DrawerProps) {
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handler);
    };
  }, [open, dismissable, onOpenChange]);

  if (!open) return null;

  const isHorizontal = side === "left" || side === "right";

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dismissable && onOpenChange(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "spectra-drawer-title" : undefined}
        className={cn(
          "absolute border-border bg-bg-elevated shadow-2xl flex flex-col",
          positionMap[side],
          isHorizontal && widthMap[width],
          className,
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <h2 id="spectra-drawer-title" className="text-sm font-semibold text-text-primary">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-xs text-text-muted">{description}</p>
              )}
            </div>
            {dismissable && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close drawer"
                className="rounded-md p-1 text-text-muted hover:bg-bg-muted hover:text-text-primary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function DrawerHeader({ className, children }: DrawerHeaderProps) {
  return (
    <div className={cn("border-b border-border px-4 py-3", className)}>{children}</div>
  );
}

export function DrawerBody({ className, children }: DrawerBodyProps) {
  return <div className={cn("flex-1 overflow-auto px-4 py-4", className)}>{children}</div>;
}

export function DrawerFooter({ className, children }: DrawerFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-border px-4 py-3", className)}>
      {children}
    </div>
  );
}