import * as React from "react";
import { cn } from "@/lib/cn";
import type { ScrollAreaProps } from "./ScrollArea.types";

const overflowMap: Record<NonNullable<ScrollAreaProps["orientation"]>, string> = {
  vertical: "overflow-y-auto overflow-x-hidden",
  horizontal: "overflow-x-auto overflow-y-hidden",
  both: "overflow-auto",
};

/**
 * A scrollable container with the studio's thin scrollbar styling.
 *
 * Keyboard scrolling works automatically because we render a native
 * `<div>` with `overflow`. For OS-native overlay scrollbars you may
 * prefer to leave the className off and let the browser decide.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    { orientation = "vertical", className, children, ...props },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(overflowMap[orientation], className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);