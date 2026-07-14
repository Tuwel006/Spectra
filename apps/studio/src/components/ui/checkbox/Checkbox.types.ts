import type { InputHTMLAttributes } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Label text rendered next to the checkbox. */
  readonly label?: string;
  /** Render the label after the checkbox. */
  readonly labelPosition?: "before" | "after";
  readonly indeterminate?: boolean;
}