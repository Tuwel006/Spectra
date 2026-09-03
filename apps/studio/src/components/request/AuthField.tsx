"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-[11px] leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field primitive                                                     */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  hint,
  icon,
  htmlFor,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {icon ? <span className="text-text-muted/80">{icon}</span> : null}
        {label}
      </span>
      <div className="w-full">{children}</div>
      {hint ? <span className="text-[11px] text-text-muted">{hint}</span> : null}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented toggle                                                    */
/* ------------------------------------------------------------------ */

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: ReadonlyArray<{ value: T; label: string; icon?: React.ReactNode }>;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full items-center gap-1 rounded-md border border-border/70 bg-bg-subtle p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              active
                ? "bg-bg-base text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scaffold notice (shared by OAuth2 + future features)                */
/* ------------------------------------------------------------------ */

export function ScaffoldNotice({
  feature,
}: {
  feature: string;
}): React.ReactElement {
  return (
    <div className="inline-flex items-start gap-2 rounded-md border border-dashed border-accent/40 bg-accent-subtle/40 p-2.5">
      <ScaffoldIcon />
      <p className="text-[11px] leading-relaxed text-text-secondary">
        <span className="font-semibold text-text-primary">{feature}</span> UI
        scaffolding is in place. Token exchange and refresh logic land in a
        later phase — see the project TODO.
      </p>
    </div>
  );
}

function ScaffoldIcon(): React.ReactElement {
  // Inline mini SVG so we don't pull AlertCircle into this leaf module —
  // keeps the primitives file dependency-free for reuse in tests.
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* JWT preview block                                                    */
/* ------------------------------------------------------------------ */

export function PreviewBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-dashed border-border/70 bg-bg-subtle/40 p-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {title}
      </span>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-bg-base/60 p-2 font-mono text-[10px] leading-relaxed text-text-secondary">
        {body}
      </pre>
    </div>
  );
}