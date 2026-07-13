import { iconSizeMap } from "./Icon.types";
import type { IconProps } from "./Icon.types";

/**
 * Wrapper around `lucide-react` icons.
 *
 * Centralises sizing tokens so consumers don't repeat `className="h-4 w-4"`
 * everywhere. Pass any lucide icon component via the `icon` prop.
 *
 * @example
 * <Icon icon={Search} size="md" />
 * <Icon icon={Check} size="sm" className="text-accent" />
 */
export function Icon({ icon: Component, size = "md", ...props }: IconProps) {
  return <Component aria-hidden size={iconSizeMap[size]} {...props} />;
}