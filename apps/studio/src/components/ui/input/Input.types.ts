import type { InputHTMLAttributes, ReactNode } from "react";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "text" | "search" | "password";
export type InputType = "text" | "search" | "password" | "email" | "url" | "tel" | "number";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Visual size of the input. Defaults to `"md"`. */
  readonly size?: InputSize;
  /** Visual variant (text / search / password). Defaults to `"text"`. */
  readonly variant?: InputVariant;
  /** Native input type. Overridden by `variant` defaults. */
  readonly type?: InputType;
  /** Optional icon rendered inside the input on the leading edge. */
  readonly leadingIcon?: ReactNode;
  /** Optional icon rendered inside the input on the trailing edge. */
  readonly trailingIcon?: ReactNode;
  /** Class name applied to the wrapping div, if any. */
  readonly wrapperClassName?: string;
  /** Whether the field is in an invalid state. */
  readonly invalid?: boolean;
}