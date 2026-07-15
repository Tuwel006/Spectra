"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

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
 * Each property of the schema is rendered as a typed input — strings
 * become text inputs (with email / password / uri specialisations
 * picked from the property name), numbers become numeric inputs,
 * booleans become switches, etc. Object properties render as nested
 * cards; arrays render as repeating rows.
 *
 * The form is fully controlled. The parent owns the value object and
 * is notified on every change so the underlying JSON body stays in
 * sync with what the user sees.
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

  return (
    <div className="flex flex-col gap-3 p-4">
      {schema.description ? (
        <p className="rounded-md border border-border bg-bg-subtle px-3 py-2 text-[11px] leading-relaxed text-text-muted">
          {schema.description}
        </p>
      ) : null}

      {properties.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-bg-subtle px-4 py-6 text-center text-[11px] italic text-text-muted">
          This schema has no properties.
        </p>
      ) : (
        properties.map((property) => {
          const name = property.name ?? property.id;
          return (
            <SmartField
              key={property.id}
              property={property}
              value={value[name]}
              onChange={(next) => onChange({ ...value, [name]: next })}
              resolveReference={resolveReference}
            />
          );
        })
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field dispatcher                                                   */
/* ------------------------------------------------------------------ */

function SmartField({
  property,
  value,
  onChange,
  resolveReference,
}: {
  property: import("@spectra/core").Property;
  value: unknown;
  onChange: (next: unknown) => void;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  const kind = inferFieldKind(property, resolveReference);
  const required = property.modifiers?.required ?? false;
  const deprecated = property.modifiers?.deprecated ?? false;
  const description = property.description;

  return (
    <label
      htmlFor={`sf-${property.id}`}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-text-primary">
          {property.name}
        </span>
        {required ? (
          <span className="text-[10px] font-semibold uppercase text-method-delete">
            required
          </span>
        ) : (
          <span className="text-[10px] uppercase text-text-muted">optional</span>
        )}
        <Badge tone="subtle" size="xs" className="font-mono">
          {kind}
        </Badge>
        {deprecated ? (
          <Badge tone="warning" size="xs">
            deprecated
          </Badge>
        ) : null}
      </div>
      {description ? (
        <span className="text-[11px] text-text-muted">{description}</span>
      ) : null}
      <FieldInput
        kind={kind}
        value={value}
        onChange={onChange}
        property={property}
        resolveReference={resolveReference}
      />
    </label>
  );
}

function FieldInput({
  kind,
  value,
  onChange,
  property,
  resolveReference,
}: {
  kind: SmartFieldKind;
  value: unknown;
  onChange: (next: unknown) => void;
  property: import("@spectra/core").Property;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  const id = `sf-${property.id}`;
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
          placeholder={property.name}
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
        />
      );
    case "text":
      return (
        <textarea
          id={id}
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={property.name}
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-bg-base px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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
          <span className="text-xs text-text-secondary">
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
        />
      );
    case "string-list":
      return <StringListField value={asList(value)} onChange={onChange} />;
    case "object": {
      const refType = property.valueType as unknown as {
        reference: { id: string };
      };
      const refSchema = resolveReference(refType.reference.id);
      if (!refSchema) {
        return (
          <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-[11px] italic text-text-muted">
            Missing schema reference.
          </p>
        );
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
          className="flex h-7 w-full rounded-md border border-border bg-bg-base px-2 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      );
    case "date-time":
      return (
        <input
          id={id}
          type="datetime-local"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          className="flex h-7 w-full rounded-md border border-border bg-bg-base px-2 text-xs text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
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
          className="flex h-7 w-full rounded-md border border-dashed border-border bg-bg-subtle px-2 text-xs text-text-secondary file:mr-2 file:rounded file:border-0 file:bg-bg-muted file:px-2 file:text-text-primary"
        />
      );
    default:
      return (
        <Input
          id={id}
          size="sm"
          value={asString(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          placeholder={property.name}
        />
      );
  }
}

/* ------------------------------------------------------------------ */
/* Nested object + list inputs                                         */
/* ------------------------------------------------------------------ */

function ObjectField({
  schema,
  value,
  onChange,
  resolveReference,
}: {
  schema: Schema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border border-border bg-bg-subtle p-3",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        <span>Object</span>
        <code className="font-mono text-text-secondary">{schema.id}</code>
      </div>
      {Object.values(schema.properties).map((property) => {
        const name = property.name ?? property.id;
        return (
          <div key={property.id} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-text-primary">
              {property.name}
              {property.modifiers?.required ? (
                <span className="ml-1 text-[10px] uppercase text-method-delete">
                  required
                </span>
              ) : null}
            </span>
            <FieldInput
              kind={inferFieldKind(property, resolveReference)}
              value={value[name]}
              onChange={(next) => onChange({ ...value, [name]: next })}
              property={property}
              resolveReference={resolveReference}
            />
          </div>
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
        <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-[11px] italic text-text-muted">
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
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remove item ${idx + 1}`}
            onClick={() => remove(idx)}
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className="self-start"
      >
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
    onChange(next);
  };
  const add = () => onChange([...value, buildInitialValue(schema, resolveReference)]);
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
          onChange={(next) => setRow(idx, next)}
          resolveReference={resolveReference}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className="self-start"
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
/* Re-exports                                                           */
/* ------------------------------------------------------------------ */

export { buildInitialValue, parseJsonSafe, stringifyJsonSafe, defaultValueFor };
