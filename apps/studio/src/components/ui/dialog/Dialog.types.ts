import type { ReactNode } from "react";

export interface DialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children: ReactNode;
  /** Optional accessible title — if absent, the dialog must provide an `aria-label` somewhere. */
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly className?: string;
  /** Disable clicking the backdrop to dismiss. */
  readonly dismissable?: boolean;
  readonly width?: "sm" | "md" | "lg" | "xl";
}

export interface DialogHeaderProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DialogBodyProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DialogFooterProps {
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface DialogCloseProps {
  readonly children: ReactNode;
  readonly className?: string;
}