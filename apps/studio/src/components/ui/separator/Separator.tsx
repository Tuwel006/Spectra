import { cn } from "@/lib/cn";
import type { SeparatorProps } from "./Separator.types";

/**
 * Visual divider — horizontal or vertical.
 *
 * When `decorative` is true the element is hidden from screen readers
 * (use this when it sits between labelled controls). Otherwise it
 * exposes `role="separator"` with an `aria-orientation` attribute.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      )}
      {...props}
    />
  );
}