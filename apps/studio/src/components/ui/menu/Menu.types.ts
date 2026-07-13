import type { ReactNode } from "react";

export interface MenuItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
  readonly checked?: boolean;
}

export interface MenuProps {
  readonly children?: ReactNode;
  readonly items: ReadonlyArray<MenuItem>;
  readonly className?: string;
  /** When true the menu is rendered with focus and listens for keyboard nav. */
  readonly autoFocus?: boolean;
}