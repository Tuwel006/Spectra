import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import type { SelectProps } from "./Select.types";

const sizeMap: Record<NonNullable<SelectProps["size"]>, string> = {
  sm: "h-7 text-xs",
  md: "h-8 text-sm",
};

/**
 * Native `<select>` wrapped with consistent studio styling.
 *
 * For richer filtering / async search, use {@link Combobox} instead.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className,
    size = "md",
    options,
    leadingIcon,
    invalid = false,
    placeholder,
    disabled,
    value,
    defaultValue,
    ...props
  },
  ref,
) {
  return (
    <span
      className={cn(
        "relative inline-flex w-full items-center rounded-md border bg-bg-base",
        sizeMap[size],
        invalid ? "border-method-delete" : "border-border",
        "focus-within:ring-2 focus-within:ring-accent/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {leadingIcon && (
        <span className="pointer-events-none absolute left-2.5 text-text-muted">{leadingIcon}</span>
      )}
      <select
        ref={ref}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue ?? (placeholder ? "" : undefined)}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-full w-full appearance-none bg-transparent pr-7 text-text-primary focus:outline-none disabled:cursor-not-allowed",
          leadingIcon ? "pl-8" : "pl-3",
          className,
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-text-muted"
      />
    </span>
  );
});