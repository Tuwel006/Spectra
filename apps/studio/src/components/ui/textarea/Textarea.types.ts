import type { TextareaHTMLAttributes } from "react";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly size?: TextareaSize;
  readonly invalid?: boolean;
  /** When true, the textarea grows with its content. */
  readonly autoResize?: boolean;
}