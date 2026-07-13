"use client";

import { forwardRef, useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/cn";
import type { CheckboxProps } from "./Checkbox.types";

/**
 * Checkbox primitive with optional label.
 *
 * Supports `indeterminate` state (e.g. for "select all" when only some
 * children are selected). Keyboard navigation works via the native
 * `<input>`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    className,
    label,
    labelPosition = "after",
    indeterminate = false,
    disabled,
    checked,
    ...props
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setRefs = (node: HTMLInputElement | null) => {
    inputRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
  };

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const input = (
    <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <input
        ref={setRefs}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        className={cn(
          "peer h-4 w-4 cursor-pointer appearance-none rounded border border-border bg-bg-base",
          "checked:bg-accent checked:border-accent",
          "indeterminate:bg-accent indeterminate:border-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-colors",
          className,
        )}
        {...props}
      />
      <Check
        aria-hidden
        className="pointer-events-none absolute h-3 w-3 text-accent-fg opacity-0 peer-checked:opacity-100"
      />
      <Minus
        aria-hidden
        className="pointer-events-none absolute h-3 w-3 text-accent-fg opacity-0 peer-indeterminate:opacity-100"
      />
    </span>
  );

  if (!label) return input;

  return (
    <label
      className={cn(
        "inline-flex select-none items-center gap-2 text-sm text-text-primary",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {labelPosition === "before" && <span>{label}</span>}
      {input}
      {labelPosition === "after" && <span>{label}</span>}
    </label>
  );
});