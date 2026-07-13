"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface KeyboardHintProps {
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Renders a small pill that visualises a keyboard shortcut, e.g.
 *  <Kbd>⌘</Kbd><Kbd>K</Kbd>
 */
export function Kbd({ children, className }: KeyboardHintProps) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-bg-subtle px-1 font-mono text-[10px] text-text-secondary",
        className,
      )}
    >
      {children}
    </kbd>
  );
}