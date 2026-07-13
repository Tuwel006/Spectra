import type { HTMLAttributes } from "react";

export type ScrollOrientation = "vertical" | "horizontal" | "both";

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  /** Which axis scrolls. Defaults to `"vertical"`. */
  readonly orientation?: ScrollOrientation;
  /** Show a thin styled scrollbar even when content doesn't overflow. */
  readonly trackVisible?: boolean;
}