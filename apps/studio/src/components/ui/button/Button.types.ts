import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Available visual variants for the {@link Button} primitive.
 *
 * - `primary` — high-emphasis action (one per region).
 * - `secondary` — neutral filled button.
 * - `ghost` — low-emphasis, transparent until hovered.
 * - `outline` — bordered, transparent.
 * - `danger` — destructive action.
 */
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

/** Available size tokens. */
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Optional icon rendered before the label. */
  readonly leadingIcon?: ReactNode;
  /** Optional icon rendered after the label. */
  readonly trailingIcon?: ReactNode;
  /** Button label. Not required when the button is icon-only. */
  readonly children?: ReactNode;
  /** Show a small spinner and disable interaction. */
  readonly loading?: boolean;
}