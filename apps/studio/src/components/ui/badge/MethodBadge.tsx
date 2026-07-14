import { cn } from "@/lib/cn";
import { Badge, methodTone } from "./Badge";
import type { BadgeSize, HttpMethodColor } from "./Badge.types";

interface MethodBadgeProps {
  readonly method: HttpMethodColor;
  readonly size?: BadgeSize;
  readonly className?: string;
}

/**
 * Coloured HTTP method chip.
 *
 * Reuses {@link Badge} under the hood so colour tokens stay
 * centralised.
 *
 * @example
 * <MethodBadge method="GET" />
 * <MethodBadge method="DELETE" size="md" />
 */
export function MethodBadge({ method, size = "sm", className }: MethodBadgeProps) {
  const minWidth = size === "xs" ? "min-w-[34px]" : size === "md" ? "min-w-[48px]" : "min-w-[40px]";
  return (
    <Badge tone={methodTone(method)} size={size} className={cn("font-semibold", minWidth, className)}>
      {method}
    </Badge>
  );
}