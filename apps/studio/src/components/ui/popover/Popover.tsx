"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import type { PopoverProps, PopoverSide } from "./Popover.types";

/**
 * Anchored popover. Renders the trigger inline and a positioned
 * floating panel below it.
 *
 * Implemented with absolute positioning relative to the wrapper — if
 * you ever need a portal-floated variant, wrap the panel in a portal.
 */
export function Popover({
  trigger,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  side = "bottom",
  align = "start",
  className,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? !!controlledOpen : internalOpen;
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) close(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const sideClass: Record<PopoverSide, string> = {
    top: "bottom-full mb-1",
    bottom: "top-full mt-1",
    left: "right-full mr-1",
    right: "left-full ml-1",
  };

  const alignClass: Record<NonNullable<PopoverProps["align"]>, string> = {
    start: side === "top" || side === "bottom" ? "left-0" : "top-0",
    center:
      side === "top" || side === "bottom"
        ? "left-1/2 -translate-x-1/2"
        : "top-1/2 -translate-y-1/2",
    end: side === "top" || side === "bottom" ? "right-0" : "bottom-0",
  };

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <div onClick={() => close(!open)} className="inline-flex">
        {trigger}
      </div>
      {open && (
        <div
          role="dialog"
          className={cn(
            "absolute z-50 min-w-[12rem] rounded-md border border-border bg-bg-elevated p-3 shadow-lg",
            sideClass[side],
            alignClass[align],
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}