import type { ReactNode } from "react";

export interface DropdownItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly shortcut?: string;
  readonly destructive?: boolean;
  readonly disabled?: boolean;
  readonly onSelect?: () => void;
}

export interface DropdownGroup {
  readonly id: string;
  readonly label?: ReactNode;
  readonly items: ReadonlyArray<DropdownItem>;
}

export interface DropdownProps {
  readonly trigger: ReactNode;
  readonly groups: ReadonlyArray<DropdownGroup>;
  readonly align?: "start" | "end";
  readonly side?: "bottom" | "top";
  readonly className?: string;
}