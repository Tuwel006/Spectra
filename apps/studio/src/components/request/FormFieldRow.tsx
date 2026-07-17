"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";

/**
 * Single row in any of the parameter / header / cookie / body tables.
 *
 * Layout (all columns aligned to a 24px baseline):
 *
 *   ┌──────┬────────┬───────────┬─────────┬──────────────────────────┬───┐
 *   │ [✓]  │ name   │ value     │ type    │ description              │ × │
 *   └──────┴────────┴───────────┴─────────┴──────────────────────────┴───┘
 *
 * Every column is optional. Inputs share the same tight styling as
 * the SmartForm so the whole workspace reads as one cohesive form.
 */
export interface FormFieldRowProps {
  /** Optional enabled toggle (params/headers/cookies). */
  enabled?: boolean;
  onEnabledChange?: (next: boolean) => void;
  /** Optional "name" input — bound to the parameter / header key. */
  name?: string;
  onNameChange?: (next: string) => void;
  namePlaceholder?: string;
  /** Optional "value" input — the value the user types in. */
  value?: string;
  onValueChange?: (next: string) => void;
  valuePlaceholder?: string;
  /** Optional type chip — schema-driven. */
  type?: string;
  /** Optional required / optional badge. */
  required?: boolean;
  /** Optional description text — read-only. */
  description?: string;
  /** Optional override of the × remove button label. */
  removeLabel?: string;
  onRemove?: () => void;
}

const INPUT_CLASS =
  "h-7 w-full rounded-sm border border-border/60 bg-bg-base px-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

export function FormFieldRow({
  enabled,
  onEnabledChange,
  name,
  onNameChange,
  namePlaceholder,
  value,
  onValueChange,
  valuePlaceholder,
  type,
  required,
  description,
  removeLabel,
  onRemove,
}: FormFieldRowProps): React.ReactElement {
  // Build the column template dynamically so columns without a control
  // don't reserve width.
  const cols: string[] = [];
  if (onEnabledChange) cols.push("28px");
  if (onNameChange) cols.push("minmax(140px,1.4fr)");
  if (onValueChange) cols.push("minmax(0,1.6fr)");
  if (type !== undefined) cols.push("80px");
  if (required !== undefined) cols.push("86px");
  if (description !== undefined) cols.push("minmax(0,2fr)");
  if (onRemove) cols.push("32px");

  return (
    <div
      className={cn(
        "grid items-center gap-2 rounded-sm border border-border/60 bg-bg-base px-2 py-1.5",
        enabled === false && "opacity-60",
      )}
      style={{ gridTemplateColumns: cols.join(" ") }}
    >
      {onEnabledChange ? (
        <Switch
          size="sm"
          checked={enabled ?? false}
          onChange={(e) => onEnabledChange(e.currentTarget.checked)}
          aria-label={`Enable ${name || "row"}`}
        />
      ) : null}

      {onNameChange ? (
        <Input
          size="sm"
          value={name ?? ""}
          onChange={(e) => onNameChange(e.currentTarget.value)}
          placeholder={namePlaceholder ?? "name"}
          className={INPUT_CLASS}
          spellCheck={false}
        />
      ) : null}

      {onValueChange ? (
        <Input
          size="sm"
          value={value ?? ""}
          onChange={(e) => onValueChange(e.currentTarget.value)}
          placeholder={valuePlaceholder ?? "value"}
          className={INPUT_CLASS}
        />
      ) : null}

      {type !== undefined ? <TypeBadge type={type} /> : null}

      {required !== undefined ? (
        <span
          className={cn(
            "inline-flex h-6 items-center justify-center rounded border text-[10px] font-semibold uppercase tracking-wider",
            required
              ? "border-method-delete/30 bg-method-delete/10 text-method-delete"
              : "border-border bg-bg-muted text-text-muted",
          )}
        >
          {required ? "required" : "optional"}
        </span>
      ) : null}

      {description !== undefined ? (
        <span
          className="truncate text-[11px] text-text-muted"
          title={description}
        >
          {description || "—"}
        </span>
      ) : null}

      {onRemove ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={removeLabel ?? "Remove row"}
          onClick={onRemove}
          className="h-7 w-7 text-text-muted hover:bg-method-delete/10 hover:text-method-delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Type chip                                                            */
/* ------------------------------------------------------------------ */

function TypeBadge({ type }: { type: string }): React.ReactElement {
  return (
    <span className="inline-flex h-6 items-center justify-center rounded-sm border border-border bg-bg-muted px-1.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
      {type}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Shared empty state                                                   */
/* ------------------------------------------------------------------ */

export function FormEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-1 rounded-sm border border-dashed border-border bg-bg-subtle px-4 py-8 text-center">
      <p className="text-xs font-medium text-text-secondary">{title}</p>
      <p className="text-[11px] text-text-muted">{description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared column header                                                 */
/* ------------------------------------------------------------------ */

export function FormColumnHeader({
  columns,
}: {
  columns: { label: string; width: string }[];
}): React.ReactElement {
  return (
    <div
      className="grid items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
      style={{ gridTemplateColumns: columns.map((c) => c.width).join(" ") }}
    >
      {columns.map((c) => (
        <span key={c.label}>{c.label}</span>
      ))}
    </div>
  );
}
