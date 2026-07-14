"use client";

import { forwardRef, useState, type ChangeEvent } from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/cn";
import type { InputProps } from "./Input.types";

const fieldStyles = cva(
  [
    "relative flex w-full items-center rounded-md border bg-bg-base transition-colors",
    "focus-within:border-accent",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "h-7 text-xs",
        md: "h-8 text-sm",
        lg: "h-10 text-sm",
      },
      state: {
        normal: "border-border",
        invalid: "border-method-delete focus-within:border-method-delete",
      },
    },
    defaultVariants: { size: "md", state: "normal" },
  },
);

const padBySize = {
  sm: { left: "pl-7", right: "pr-7", iconL: "left-2", iconR: "right-2", iconSize: "h-3 w-3" },
  md: { left: "pl-8", right: "pr-8", iconL: "left-2.5", iconR: "right-2.5", iconSize: "h-3.5 w-3.5" },
  lg: { left: "pl-10", right: "pr-10", iconL: "left-3", iconR: "right-3", iconSize: "h-4 w-4" },
} as const;

/**
 * Text input primitive — supports `text`, `search` and `password`
 * variants via the `variant` prop. For search inputs, a clear button
 * appears when the field has a value.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    wrapperClassName,
    size = "md",
    variant = "text",
    leadingIcon,
    trailingIcon,
    invalid = false,
    type,
    value,
    onChange,
    disabled,
    ...props
  },
  ref,
) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    typeof value === "string" ? value : "",
  );
  const [reveal, setReveal] = useState(false);

  const current = isControlled ? String(value ?? "") : internalValue;
  const showClear = variant === "search" && current.length > 0 && !disabled;
  const iconSize = padBySize[size].iconSize;

  const resolvedType =
    variant === "password" ? (reveal ? "text" : "password") : (type ?? (variant === "search" ? "search" : "text"));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  };

  const defaultLeading = variant === "search" ? <Search className={cn("text-text-muted", iconSize)} aria-hidden /> : null;
  const defaultTrailing = variant === "password" ? (
    <button
      type="button"
      onClick={() => setReveal((r) => !r)}
      aria-label={reveal ? "Hide password" : "Show password"}
      className="text-text-muted hover:text-text-primary"
      tabIndex={-1}
    >
      {reveal ? <EyeOff className={iconSize} aria-hidden /> : <Eye className={iconSize} aria-hidden />}
    </button>
  ) : null;

  return (
    <div
      className={cn(
        fieldStyles({ size, state: invalid ? "invalid" : "normal" }),
        (leadingIcon || defaultLeading) && padBySize[size].left,
        (trailingIcon || defaultTrailing || showClear) && padBySize[size].right,
        wrapperClassName,
      )}
    >
      {(leadingIcon || defaultLeading) && (
        <span className={cn("pointer-events-none absolute text-text-muted", padBySize[size].iconL)}>
          {leadingIcon ?? defaultLeading}
        </span>
      )}
      <input
        ref={ref}
        type={resolvedType}
        value={current}
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        style={{
          outline: "none",
          outlineOffset: "0",
          WebkitAppearance: "none",
          appearance: "none",
          boxShadow: "none",
        }}
        className={cn(
          "h-full w-full min-w-0 flex-1 appearance-none border-0 bg-transparent text-text-primary outline-none placeholder:text-text-muted focus:outline-none focus:ring-0 focus:shadow-none disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
          className,
        )}
        {...props}
      />
      {showClear ? (
        <button
          type="button"
          onClick={() => {
            if (!isControlled) setInternalValue("");
            const evt = {
              target: { value: "" },
              currentTarget: { value: "" },
            } as unknown as ChangeEvent<HTMLInputElement>;
            onChange?.(evt);
          }}
          aria-label="Clear search"
          className={cn("absolute text-text-muted hover:text-text-primary", padBySize[size].iconR)}
          tabIndex={-1}
        >
          <X className={iconSize} aria-hidden />
        </button>
      ) : (trailingIcon || defaultTrailing) ? (
        <span className={cn("absolute text-text-muted", padBySize[size].iconR)}>
          {trailingIcon ?? defaultTrailing}
        </span>
      ) : null}
    </div>
  );
});