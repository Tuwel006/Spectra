"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { Schema } from "@spectra/core";

import {
  buildInitialValue,
  defaultResolveReference,
  defaultValueFor,
  inferFieldKind,
  parseJsonSafe,
  stringifyJsonSafe,
  type SmartFieldKind,
} from "./smartFormInference";

/* ------------------------------------------------------------------ */
/* SmartForm                                                            */
/* ------------------------------------------------------------------ */

/**
 * Generate a form automatically from an OpenAPI schema.
 *
 * Each property of the schema is rendered as a single horizontal row:
 *   [variable name] [required / optional] [type] [input] [×]
 *
 * Rows are stacked vertically inside a scrollable container. Users can
 * remove a row with the × button or add a brand-new free-form field
 * with the + button at the bottom. The form is fully controlled — the
 * parent owns the value object and is notified on every change so the
 * underlying JSON body stays in sync.
 */
export function SmartForm({
  schema,
  value,
  onChange,
  resolveReference = defaultResolveReference,
}: {
  schema: Schema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  resolveReference?: (id: string) => Schema | undefined;
}): React.ReactElement {
  const properties = React.useMemo(
    () => Object.values(schema.properties),
    [schema],
  );

  // Track which row the user explicitly removed so we can suppress
  // them on the next render. Schema-driven properties always show;
  // the remove button is only available for user-added free-form
  // fields that we track under an `__added__` key namespace.
  const userFields = React.useMemo(
    () =>
      Object.entries(value)
        .filter(([key]) => key.startsWith("__added__:"))
        .map(([key, val]) => {
          const name = key.slice("__added__:".length);
          return { name, value: val };
        }),
    [value],
  );

  const handleRemoveSchema = React.useCallback(
    (name: string) => {
      const next = { ...value };
      delete next[name];
      onChange(next);
    },
    [value, onChange],
  );

  const handleRemoveAdded = React.useCallback(
    (key: string) => {
      const next = { ...value };
      delete next[key];
      onChange(next);
    },
    [value, onChange],
  );

  const handleAdd = React.useCallback(() => {
    // Pick a free name that doesn't collide with existing properties.
    let i = 1;
    let key = `field${i}`;
    while (key in value) {
      i += 1;
      key = `field${i}`;
    }
    onChange({ ...value, [key]: "" });
  }, [value, onChange]);

  const handleAddedChange = React.useCallback(
    (key: string, v: string) => {
      onChange({ ...value, [key]: v });
    },
    [value, onChange],
  );

  return (
    <div className="flex flex-col gap-2 p-3">
      {schema.description ? (
        <p className="rounded-md border border-border bg-bg-subtle px-3 py-2 text-[11px] leading-relaxed text-text-muted">
          {schema.description}
        </p>
      ) : null}

      {properties.length === 0 && userFields.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-bg-subtle px-4 py-6 text-center text-[11px] italic text-text-muted">
          This schema has no properties.
        </p>
      ) : null}

      {/* Schema-driven properties */}
      {properties.map((property) => {
        const name = property.name ?? property.id;
        return (
          <FieldRow
            key={property.id}
            name={name}
            value={value[name]}
            kind={inferFieldKind(property, resolveReference)}
            required={property.modifiers?.required ?? false}
            deprecated={property.modifiers?.deprecated ?? false}
            description={property.description}
            onChange={(next) => onChange({ ...value, [name]: next })}
            onRemove={() => handleRemoveSchema(name)}
            resolveReference={resolveReference}
            property={property}
            removable
          />
        );
      })}

      {/* User-added free-form fields */}
      {userFields.map(({ name, value: v }, idx) => {
        const key = `__added__:${name}`;
        return (
          <FieldRow
            key={`${key}-${idx}`}
            name={name}
            value={v}
            kind="string"
            required={false}
            deprecated={false}
            description={undefined}
            onChange={(next) => handleAddedChange(key, asString(next))}
            onRemove={() => handleRemoveAdded(key)}
            resolveReference={resolveReference}
            property={undefined}
            removable
            editableName
            onRename={(newName) => {
              // Rename by deleting the old key and creating a fresh one.
              const next = { ...value };
              delete next[key];
              const targetKey = `__added__:${newName}`;
              next[targetKey] = v;
              onChange(next);
            }}
          />
        );
      })}

      {/* Add field row */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5 text-text-secondary"
        >
          <Plus className="h-3.5 w-3.5" />
          Add field
        </Button>
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          Append an ad-hoc field
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single-row field                                                    */
/* ------------------------------------------------------------------ */

function FieldRow({
  name,
  value,
  kind,
  required,
  deprecated,
  description,
  onChange,
  onRemove,
  resolveReference,
  property,
  removable,
  editableName,
  onRename,
}: {
  name: string;
  value: unknown;
  kind: SmartFieldKind | "string";
  required: boolean;
  deprecated: boolean;
  description?: string;
  onChange: (next: unknown) => void;
  onRemove: () => void;
  resolveReference: (id: string) => Schema | undefined;
  property?: import("@spectra/core").Property;
  removable: boolean;
  editableName?: boolean;
  onRename?: (next: string) => void;
}): React.ReactElement {
  void editableName; // kept for type symmetry; row's name input is always editable.

  return (
    <div
      className={cn(
        "grid items-center gap-1.5 rounded border border-border bg-bg-base",
        "grid-cols-[160px_72px_minmax(0,1fr)_32px]",
      )}
    >
      {/* Variable name — always rendered as an input so users can
          rename schema fields when the spec is wrong, not just
          user-added rows. Schema-driven names go through a controlled
          value that the parent commits; user-added names use the
          inline rename path. */}
      <Input
        size="sm"
        value={name}
        onChange={(e) => {
          const next = e.currentTarget.value;
          if (editableName && onRename) onRename(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        className="rounded border-border bg-bg-muted/40 px-2 font-mono text-[12px]"
        aria-label="Field name"
        spellCheck={false}
      />

      {/* Required / Optional tag */}
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

      {/* Input */}
      <div className="min-w-0">
        <FieldInput
          kind={kind}
          value={value}
          onChange={onChange}
          property={property}
          resolveReference={resolveReference}
        />
      </div>

      {/* Remove (×) button */}
      <Tooltip content={removable ? "Remove field" : "Remove"} side="left">
        <button
          type="button"
          onClick={onRemove}
          disabled={!removable}
          aria-label={`Remove ${name}`}
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted transition-colors",
            removable
              ? "hover:bg-method-delete/10 hover:text-method-delete"
              : "cursor-not-allowed opacity-40",
          )}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </Tooltip>

      {/* Hidden badge cluster for type + deprecated — kept off-row so
          the field row stays a single horizontal line. Surfaced as
          small badges in the value cell when relevant. */}
      {deprecated ? (
        <Badge tone="warning" size="xs" className="col-span-4 -mt-1">
          deprecated
        </Badge>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Input dispatcher                                                   */
/* ------------------------------------------------------------------ */

function FieldInput({
  kind,
  value,
  onChange,
  property,
  resolveReference,
}: {
  kind: SmartFieldKind | "string";
  value: unknown;
  onChange: (next: unknown) => void;
  property?: import("@spectra/core").Property;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  const id = property
    ? `sf-${property.id}`
    : `sf-${Math.random().toString(36).slice(2, 8)}`;

  // Shared styling for the body of every field — small radius,
  // tight horizontal padding, soft border that tightens on focus.
  const inputClass =
    "h-7 w-full rounded-sm border border-border/60 bg-bg-base px-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40";

  switch (kind) {
    case "string":
    case "email":
    case "uri":
      return (
        <Input
          id={id}
          size="sm"
          type={
            kind === "email"
              ? "email"
              : kind === "uri"
                ? "url"
                : "text"
          }
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={property?.name ?? ""}
          className={inputClass}
        />
      );
    case "password":
      return (
        <Input
          id={id}
          size="sm"
          type="password"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder="••••••••"
          className={inputClass}
        />
      );
    case "text":
      return (
        <textarea
          id={id}
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={property?.name ?? ""}
          rows={2}
          className="w-full resize-y rounded-sm border border-border/60 bg-bg-base px-2 py-1 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      );
    case "number":
    case "integer":
      return (
        <Input
          id={id}
          size="sm"
          type="number"
          value={asString(value)}
          onChange={(e) => {
            const n = Number(e.currentTarget.value);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          step={kind === "integer" ? 1 : "any"}
          placeholder="0"
          className={inputClass}
        />
      );
    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Switch
            id={id}
            checked={value === true}
            onChange={(e) => onChange(e.currentTarget.checked)}
          />
          <span className="font-mono text-[11px] text-text-secondary">
            {value === true ? "true" : "false"}
          </span>
        </div>
      );
    case "enum":
    case "select":
      return (
        <Select
          size="sm"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          options={[
            { value: "", label: "Select…" },
            { value: "true", label: "true" },
            { value: "false", label: "false" },
          ]}
          className="h-7 w-full"
        />
      );
    case "string-list":
      return <StringListField value={asList(value)} onChange={onChange} />;
    case "object": {
      if (!property) {
        return <NestedEmpty />;
      }
      const refSchema = resolveReference(
        (property.valueType as unknown as { reference: { id: string } })
          .reference.id,
      );
      if (!refSchema) {
        return <NestedEmpty />;
      }
      return (
        <ObjectField
          schema={refSchema}
          value={asObject(value)}
          onChange={onChange}
          resolveReference={resolveReference}
        />
      );
    }
    case "object-list":
      if (!property) {
        return <NestedEmpty />;
      }
      return (
        <ObjectListField
          schema={
            resolveReference(
              (property.valueType as unknown as {
                elementType: { reference: { id: string } };
              }).elementType.reference.id,
            )!
          }
          value={asList(value)}
          onChange={onChange}
          resolveReference={resolveReference}
        />
      );
    case "date":
      return (
        <input
          id={id}
          type="date"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          className={inputClass}
        />
      );
    case "date-time":
      return (
        <input
          id={id}
          type="datetime-local"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          className={inputClass}
        />
      );
    case "file":
      return (
        <input
          id={id}
          type="file"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            onChange(file ? file.name : "");
          }}
          className="flex h-7 w-full rounded-sm border border-dashed border-border bg-bg-subtle px-2 text-[12px] text-text-secondary file:mr-2 file:rounded-sm file:border-0 file:bg-bg-muted file:px-2 file:text-text-primary"
        />
      );
    default:
      return (
        <Input
          id={id}
          size="sm"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={property?.name ?? ""}
          className={inputClass}
        />
      );
  }
}

/* ------------------------------------------------------------------ */
/* Nested layouts                                                       */
/* ------------------------------------------------------------------ */

function NestedEmpty(): React.ReactElement {
  return (
    <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-[11px] italic text-text-muted">
      Missing schema reference.
    </p>
  );
}

function ObjectField({
  schema,
  value,
  onChange,
  resolveReference,
}: {
  schema: Schema;
  value: Record<string, unknown>;
  onChange: (next: unknown) => void;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-sm border border-border/60 bg-bg-subtle/50 p-2",
      )}
    >
      <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
        Object · {schema.id}
      </span>
      {Object.values(schema.properties).map((property) => {
        const n = property.name ?? property.id;
        return (
          <FieldRow
            key={property.id}
            name={n}
            value={value[n]}
            kind={inferFieldKind(property, resolveReference)}
            required={property.modifiers?.required ?? false}
            deprecated={property.modifiers?.deprecated ?? false}
            description={property.description}
            onChange={(next) => onChange({ ...value, [n]: next })}
            onRemove={() => {
              const nextObj = { ...value };
              delete nextObj[n];
              onChange(nextObj);
            }}
            resolveReference={resolveReference}
            property={property}
            removable
          />
        );
      })}
    </div>
  );
}

function StringListField({
  value,
  onChange,
}: {
  value: unknown[];
  onChange: (next: unknown) => void;
}): React.ReactElement {
  const setRow = (idx: number, v: string) => {
    const next = value.slice();
    next[idx] = v;
    onChange(next);
  };
  const add = () => onChange([...value, ""]);
  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };
  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 ? (
        <p className="rounded-sm border border-dashed border-border bg-bg-subtle px-2 py-1.5 text-[11px] italic text-text-muted">
          Empty list — add the first item below.
        </p>
      ) : null}
      {value.map((row, idx) => (
        <div key={idx} className="flex items-center gap-1.5">
          <Input
            size="sm"
            value={asString(row)}
            onChange={(e) => setRow(idx, e.currentTarget.value)}
            placeholder={`Item ${idx + 1}`}
            className="h-7 flex-1 rounded-sm border border-border/60 bg-bg-base px-2 text-[12px] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <Tooltip content="Remove item" side="left">
            <button
              type="button"
              onClick={() => remove(idx)}
              aria-label={`Remove item ${idx + 1}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-text-muted hover:bg-method-delete/10 hover:text-method-delete"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </Tooltip>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="self-start gap-1.5">
        <Plus className="h-3.5 w-3.5" />
        Add item
      </Button>
    </div>
  );
}

function ObjectListField({
  schema,
  value,
  onChange,
  resolveReference,
}: {
  schema: Schema;
  value: unknown[];
  onChange: (next: unknown) => void;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  const setRow = (idx: number, v: Record<string, unknown>) => {
    const next = value.slice();
    next[idx] = v;
    onChange(next as unknown);
  };
  const add = () =>
    onChange([...value, buildInitialValue(schema, resolveReference)]);
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  return (
    <div className="flex flex-col gap-1.5">
      {value.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-[11px] italic text-text-muted">
          Empty list — add the first object below.
        </p>
      ) : null}
      {value.map((row, idx) => (
        <ObjectField
          key={idx}
          schema={schema}
          value={asObject(row)}
          onChange={(next) => {
            const arr = value.slice();
            arr[idx] = next;
            onChange(arr);
          }}
          resolveReference={resolveReference}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className="self-start gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add {schema.id ?? "object"}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Coercion helpers                                                    */
/* ------------------------------------------------------------------ */

function asString(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
}

function asList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return [];
}

function asObject(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

/* ------------------------------------------------------------------ */
/* Inline tooltip                                                       */
/* ------------------------------------------------------------------ */

import { Tooltip } from "@/components/ui/tooltip";

/* ------------------------------------------------------------------ */
/* Re-exports                                                           */
/* ------------------------------------------------------------------ */

export { buildInitialValue, parseJsonSafe, stringifyJsonSafe, defaultValueFor };