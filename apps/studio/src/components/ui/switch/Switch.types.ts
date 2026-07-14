import type { InputHTMLAttributes } from "react";

export type SwitchSize = "sm" | "md";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  readonly label?: string;
  readonly size?: SwitchSize;
}