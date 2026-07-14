import type { ReactNode } from "react";

export type PopoverSide = "top" | "right" | "bottom" | "left";

export interface PopoverProps {
  readonly trigger: ReactNode;
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly side?: PopoverSide;
  readonly align?: "start" | "center" | "end";
  readonly className?: string;
}