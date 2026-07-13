import type { SelectHTMLAttributes, ReactNode } from "react";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  readonly size?: "sm" | "md";
  readonly options: ReadonlyArray<SelectOption>;
  /** Optional leading icon. */
  readonly leadingIcon?: ReactNode;
  readonly invalid?: boolean;
  /** Render a placeholder as the first option with empty value. */
  readonly placeholder?: string;
}