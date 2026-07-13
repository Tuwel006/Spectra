import type { HTMLAttributes } from "react";

export type SeparatorOrientation = "horizontal" | "vertical";

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator. Defaults to `"horizontal"`. */
  readonly orientation?: SeparatorOrientation;
  /** When true, the separator is purely decorative and removed from the a11y tree. */
  readonly decorative?: boolean;
}