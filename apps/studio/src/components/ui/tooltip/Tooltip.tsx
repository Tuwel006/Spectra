"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { TooltipProps } from "./Tooltip.types";

/**
 * Lightweight hover/focus tooltip.
 *
 * Implemented with `position: absolute` rather than a portal so it
 * stays simple. If the application ever needs tooltips over
 * `overflow:hidden` containers, swap to `@radix-ui/react-tooltip`
 * without touching callers — the public API stays the same.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 200,
  disabled = false,
}: TooltipProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null);

  const show = React.useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  }, [delay, disabled]);

  const hide = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }, []);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const sideClasses: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full mb-1.5",
    bottom: "top-full mt-1.5",
    left: "right-full mr-1.5",
    right: "left-full ml-1.5",
  };

  const alignClasses: Record<NonNullable<TooltipProps["align"]>, Record<NonNullable<TooltipProps["side"]>, string>> = {
    center: {
      top: "left-1/2 -translate-x-1/2",
      bottom: "left-1/2 -translate-x-1/2",
      left: "top-1/2 -translate-y-1/2",
      right: "top-1/2 -translate-y-1/2",
    },
    start: {
      top: "left-0",
      bottom: "left-0",
      left: "top-0",
      right: "top-0",
    },
    end: {
      top: "right-0",
      bottom: "right-0",
      left: "bottom-0",
      right: "bottom-0",
    },
  };

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {!disabled && (
        <span
          role="tooltip"
          aria-hidden={!open}
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text-secondary shadow-sm",
            "transition-opacity duration-150",
            open ? "opacity-100" : "opacity-0",
            sideClasses[side],
            alignClasses[align][side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}