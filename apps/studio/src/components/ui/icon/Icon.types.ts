import type { LucideIcon, LucideProps } from "lucide-react";

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconProps extends Omit<LucideProps, "size"> {
  /** The lucide-react icon component to render. */
  readonly icon: LucideIcon;
  /** Predefined size token. Overrides `width`/`height` if both set. */
  readonly size?: IconSize;
}

export const iconSizeMap: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};