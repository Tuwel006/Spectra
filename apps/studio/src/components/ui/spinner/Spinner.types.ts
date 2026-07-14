export type SpinnerSize = "xs" | "sm" | "md" | "lg";

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  /** Accessible label for screen readers. Defaults to `"Loading"`. */
  readonly label?: string;
  readonly className?: string;
}