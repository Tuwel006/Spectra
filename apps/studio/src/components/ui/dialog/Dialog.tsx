"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  DialogProps,
  DialogHeaderProps,
  DialogBodyProps,
  DialogFooterProps,
  DialogCloseProps,
} from "./Dialog.types";

const widthMap: Record<NonNullable<DialogProps["width"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const titleId = "spectra-dialog-title";

/**
 * Accessible modal dialog.
 *
 * - Renders into a portal at `document.body`.
 * - Locks body scroll while open.
 * - Dismisses on `Escape` (unless `dismissable=false`).
 * - Dismisses on backdrop click (unless `dismissable=false`).
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  dismissable = true,
  width = "md",
}: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocused = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissable) {
        event.stopPropagation();
        onOpenChange(false);
      } else if (event.key === "Tab") {
        // Simple focus trap: cycle within the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);

    // Focus first focusable inside the dialog.
    const focusTimer = window.setTimeout(() => {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      focusables?.[0]?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      window.clearTimeout(focusTimer);
      previouslyFocused.current?.focus?.();
    };
  }, [open, dismissable, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => dismissable && onOpenChange(false)}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? `${titleId}-desc` : undefined}
        className={cn(
          "relative z-10 m-4 w-full rounded-lg border border-border bg-bg-elevated shadow-2xl",
          widthMap[width],
          className,
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
            <div>
              <h2 id={titleId} className="text-sm font-semibold text-text-primary">
                {title}
              </h2>
              {description && (
                <p id={`${titleId}-desc`} className="mt-0.5 text-xs text-text-muted">
                  {description}
                </p>
              )}
            </div>
            {dismissable && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close dialog"
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

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn("border-b border-border px-4 py-3", className)}>{children}</div>;
}

export function DialogBody({ className, children }: DialogBodyProps) {
  return <div className={cn("px-4 py-4", className)}>{children}</div>;
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-border px-4 py-3", className)}>
      {children}
    </div>
  );
}

/** Helper that renders a button which closes its enclosing dialog via context. */
export function DialogClose({ children, className }: DialogCloseProps) {
  return (
    <DialogCloseContext.Consumer>
      {(close) => (
        <button
          type="button"
          onClick={() => close?.()}
          className={cn("rounded-md", className)}
        >
          {children}
        </button>
      )}
    </DialogCloseContext.Consumer>
  );
}

const DialogCloseContext = React.createContext<(() => void) | null>(null);