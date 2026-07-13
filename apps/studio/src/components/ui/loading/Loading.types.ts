import type { ReactNode } from "react";
import type { SpinnerSize } from "../spinner/Spinner.types";

export interface LoadingProps {
  /** Spinner size. Defaults to `"md"`. */
  readonly size?: SpinnerSize;
  /** Optional label displayed beside the spinner. */
  readonly label?: string;
  /** Render as a full-region overlay. */
  readonly fullPage?: boolean;
  readonly className?: string;
  /** Children rendered alongside (e.g. inline text). */
  readonly children?: ReactNode;
}