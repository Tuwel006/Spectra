import type { ReactNode } from "react";

export type DrawerSide = "right" | "left" | "top" | "bottom";

export interface DrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly side?: DrawerSide;
  readonly width?: "sm" | "md" | "lg" | "xl";
  readonly className?: string;
  readonly dismissable?: boolean;
}

export interface DrawerHeaderProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DrawerBodyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DrawerFooterProps {
  readonly children?: ReactNode;
  readonly className?: string;
}