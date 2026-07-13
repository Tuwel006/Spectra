import { cn } from "@/lib/cn";
import { Spinner } from "../spinner/Spinner";
import type { LoadingProps } from "./Loading.types";

/**
 * Centred loading state. Use `fullPage` to cover the entire parent
 * region (e.g. while data is hydrating), or pass `children` to render
 * inline content alongside the spinner.
 */
export function Loading({
  size = "md",
  label,
  fullPage = false,
  className,
  children,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 text-text-muted",
        fullPage ? "h-full w-full" : "py-4",
        className,
      )}
    >
      <Spinner size={size} label={label ?? "Loading"} />
      {label && <span className="text-xs">{label}</span>}
      {children}
    </div>
  );
}