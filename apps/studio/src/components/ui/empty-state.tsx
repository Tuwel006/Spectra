"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EmptyStateProps {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * Reusable empty-state component used by explorer sections, search and the
 * command palette. Keeps the visual rhythm consistent everywhere.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="rounded-full bg-bg-muted p-3 text-text-muted">{icon}</div>
      ) : null}
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}