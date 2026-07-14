import type { ReactNode } from "react";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";

export interface TooltipProps {
  /** Tooltip text or rich content. */
  readonly content: ReactNode;
  /** Element that triggers the tooltip. Must accept a ref. */
  readonly children: ReactNode;
  /** Which side of the trigger the tooltip appears on. Defaults to `"top"`. */
  readonly side?: TooltipSide;
  /** Alignment along the chosen side. Defaults to `"center"`. */
  readonly align?: TooltipAlign;
  /** Delay in ms before showing on hover. Defaults to `200`. */
  readonly delay?: number;
  /** Disable the tooltip entirely. */
  readonly disabled?: boolean;
}