import type { ReactNode } from "react";

export interface TabItem {
  readonly id: string;
  readonly label: ReactNode;
  /** Optional badge rendered next to the label (counts, "new", etc). */
  readonly badge?: ReactNode;
  readonly disabled?: boolean;
  /** When true, the tab is omitted from the strip entirely. */
  readonly hidden?: boolean;
}

export interface TabsProps {
  readonly items: ReadonlyArray<TabItem>;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (id: string) => void;
  /** Render the tab strip vertically. Defaults to `"horizontal"`. */
  readonly orientation?: "horizontal" | "vertical";
  readonly variant?: "default" | "pills";
  readonly className?: string;
}

export interface TabPanelProps {
  readonly value: string;
  readonly activeValue: string;
  readonly children: ReactNode;
  /** If true, the panel is kept mounted but hidden. */
  readonly keepMounted?: boolean;
}