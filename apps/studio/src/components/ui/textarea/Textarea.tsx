"use client";

import { forwardRef, useEffect, useRef } from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/cn";
import type { TextareaProps } from "./Textarea.types";

const fieldStyles = cva(
  [
    "block w-full rounded-md border bg-bg-base px-3 py-2 text-sm",
    "text-text-primary placeholder:text-text-muted resize-y",
    "focus:outline-none focus:ring-2 focus:ring-accent/40",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        sm: "min-h-[60px] text-xs",
        md: "min-h-[88px]",
        lg: "min-h-[140px]",
      },
      state: {
        normal: "border-border",
        invalid: "border-method-delete focus:ring-method-delete/30",
      },
    },
    defaultVariants: { size: "md", state: "normal" },
  },
);

/**
 * Multi-line text input. Set `autoResize` to make the field grow with
 * its content (uses a measured height on every keystroke).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    className,
    size = "md",
    invalid = false,
    autoResize = false,
    onInput,
    value,
    defaultValue,
    ...props
  },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Forward refs to inner ref so we can measure.
  const setRefs = (node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
  };

  useEffect(() => {
    if (!autoResize) return;
    const node = innerRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${node.scrollHeight}px`;
  }, [autoResize, value, defaultValue]);

  return (
    <textarea
      ref={setRefs}
      value={value}
      defaultValue={defaultValue}
      onInput={(event) => {
        if (autoResize) {
          const node = event.currentTarget;
          node.style.height = "auto";
          node.style.height = `${node.scrollHeight}px`;
        }
        onInput?.(event);
      }}
      aria-invalid={invalid || undefined}
      className={cn(fieldStyles({ size, state: invalid ? "invalid" : "normal" }), className)}
      {...props}
    />
  );
});