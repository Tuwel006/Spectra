import type { ReactNode } from "react";

export interface ComboboxOption {
  readonly value: string;
  readonly label: string;
  /** Optional sub-label rendered to the right of the label. */
  readonly description?: string;
  readonly disabled?: boolean;
  /** Optional group label — items with the same group are rendered together. */
  readonly group?: string;
}

export interface ComboboxProps {
  readonly options: ReadonlyArray<ComboboxOption>;
  /** Currently selected value(s). */
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly emptyMessage?: ReactNode;
  readonly disabled?: boolean;
  readonly invalid?: boolean;
  readonly className?: string;
  /** Render the dropdown inline (no overlay). Defaults to `false`. */
  readonly inline?: boolean;
  readonly name?: string;
}