import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Optional icon rendered above the title. */
  readonly icon?: ReactNode;
  /** Heading text. */
  readonly title: string;
  /** Supporting copy below the heading. */
  readonly description?: ReactNode;
  /** Call-to-action area (e.g. buttons). */
  readonly action?: ReactNode;
  readonly className?: string;
}