"use client";

import * as React from "react";
import { Box, ChevronDown, ChevronRight, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import {
  PrimitiveTypeName,
  TypeKind,
  type ArrayType,
  type PrimitiveType,
  type Property,
  type PropertyModifier,
  type ReferenceType,
  type Schema,
} from "@spectra/core";

import { lookupSchema } from "./response.types";

/**
 * Recursive schema explorer. Renders the schema referenced by the
 * selected response and drills into referenced / array / primitive
 * types. Supports expand/collapse per node, with all nodes starting
 * open to match the rest of the viewer.
 */
export function ResponseSchema({
  schemaName,
  visited,
}: {
  schemaName: string;
  visited?: ReadonlySet<string>;
}): React.ReactElement {
  const schema = lookupSchema(schemaName);
  if (!schema) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-xs italic text-text-muted">
        Schema <code className="font-mono">{schemaName}</code> not found.
      </div>
    );
  }

  const visitedSafe = visited ?? new Set<string>();

  return (
    <div className="flex flex-col gap-4 p-4">
      <SchemaHeader schema={schema} />

      <div className="rounded-md border border-border bg-bg-base">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border bg-bg-muted px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <span>Property</span>
          <span className="text-right">Type</span>
          <span className="text-right">Flags</span>
        </div>
        <ul className="divide-y divide-border">
          {Object.entries(schema.properties).map(([propName, prop]) => (
            <SchemaPropertyRow
              key={prop.id}
              name={propName}
              prop={prop}
              visited={new Set(visitedSafe).add(schema.id)}
            />
          ))}
        </ul>
        {Object.keys(schema.properties).length === 0 ? (
          <p className="px-3 py-3 text-xs italic text-text-muted">
            This schema has no properties.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SchemaHeader({ schema }: { schema: Schema }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Box className="h-4 w-4 text-text-muted" aria-hidden="true" />
        <h3 className="font-mono text-sm font-semibold text-text-primary">
          {schema.name ?? schema.id}
        </h3>
        <Badge tone="accent" size="xs">
          Schema
        </Badge>
      </div>
      {schema.description ? (
        <p className="max-w-3xl text-xs leading-relaxed text-text-secondary">
          {schema.description}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Property row                                                          */
/* ------------------------------------------------------------------ */

function SchemaPropertyRow({
  name,
  prop,
  visited,
}: {
  name: string;
  prop: Property;
  visited: ReadonlySet<string>;
}): React.ReactElement {
  const [open, setOpen] = React.useState(true);
  const expand = isExpandable(prop.valueType as PrimitiveType | ReferenceType | ArrayType, visited);
  const flags = describeFlags(prop.modifiers);
  const typeLabel = describeType(prop.valueType as PrimitiveType | ReferenceType | ArrayType);

  return (
    <li className="px-3 py-2">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={() => expand && setOpen((o) => !o)}
          aria-expanded={expand ? open : undefined}
          aria-label={expand ? `Toggle ${name}` : undefined}
          className={cn(
            "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary",
            !expand && "invisible",
          )}
        >
          {open ? (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          )}
        </button>

        <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_auto] gap-2">
          <div className="flex min-w-0 flex-col">
            <code className="break-all font-mono text-xs text-text-primary">
              {name}
            </code>
            {prop.description ? (
              <p className="mt-0.5 text-[11px] leading-relaxed text-text-muted">
                {prop.description}
              </p>
            ) : null}
          </div>

          <span className="whitespace-nowrap text-right font-mono text-[11px] text-text-secondary">
            {typeLabel}
          </span>

          <span className="flex flex-wrap items-center justify-end gap-1">
            {flags.length === 0 ? (
              <span className="text-[10px] uppercase tracking-wider text-text-muted">
                —
              </span>
            ) : (
              flags.map((f) => (
                <Badge key={f.label} tone={f.tone} size="xs">
                  {f.label}
                </Badge>
              ))
            )}
          </span>
        </div>
      </div>

      {expand && open ? (
        <div className="ml-4 mt-2">
          <TypeDrilldown
            type={prop.valueType as PrimitiveType | ReferenceType | ArrayType}
            visited={visited}
          />
        </div>
      ) : null}
    </li>
  );
}

function describeFlags(modifiers: PropertyModifier): readonly { readonly label: string; readonly tone: "success" | "warning" | "info" | "danger" | "neutral" | "accent" }[] {
  const out: { label: string; tone: "success" | "warning" | "info" | "danger" | "neutral" | "accent" }[] = [];
  if (modifiers.required) out.push({ label: "required", tone: "success" });
  if (modifiers.nullable) out.push({ label: "nullable", tone: "warning" });
  if (modifiers.readonly) out.push({ label: "readonly", tone: "info" });
  if (modifiers.deprecated) out.push({ label: "deprecated", tone: "danger" });
  return out;
}

function describeType(
  type:
    | PrimitiveType
    | ReferenceType
    | ArrayType,
): string {
  switch (type.kind) {
    case TypeKind.PRIMITIVE:
      return type.name;
    case TypeKind.REFERENCE:
      return type.reference.id;
    case TypeKind.ARRAY:
      return `${describeType(type.elementType as never)}[]`;
  }
}

function isExpandable(
  type: PrimitiveType | ReferenceType | ArrayType,
  visited: ReadonlySet<string>,
): boolean {
  if (type.kind === TypeKind.REFERENCE) return !visited.has(type.reference.id);
  if (type.kind === TypeKind.ARRAY) {
    return isExpandable(type.elementType as PrimitiveType | ReferenceType | ArrayType, visited);
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* Drilldown for nested types                                            */
/* ------------------------------------------------------------------ */

function TypeDrilldown({
  type,
  visited,
}: {
  type: PrimitiveType | ReferenceType | ArrayType;
  visited: ReadonlySet<string>;
}): React.ReactElement {
  if (type.kind === TypeKind.PRIMITIVE) {
    return (
      <p className="text-[11px] italic text-text-muted">
        Primitive <code className="font-mono">{type.name}</code>
      </p>
    );
  }

  if (type.kind === TypeKind.ARRAY) {
    return (
      <div className="rounded-md border border-dashed border-border bg-bg-subtle/50 p-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Array of
        </div>
        <TypeDrilldown
          type={type.elementType as PrimitiveType | ReferenceType | ArrayType}
          visited={visited}
        />
      </div>
    );
  }

  // Reference: render full schema (recursive).
  const inner = lookupSchema(type.reference.id);
  if (!inner) {
    return (
      <div className="flex items-center gap-1 text-[11px] italic text-text-muted">
        <Link2 className="h-3 w-3" aria-hidden="true" />
        Unresolved reference{" "}
        <code className="font-mono">{type.reference.id}</code>
      </div>
    );
  }

  if (visited.has(type.reference.id)) {
    return (
      <div className="flex items-center gap-1 text-[11px] italic text-text-muted">
        <Link2 className="h-3 w-3" aria-hidden="true" />
        Already shown above ({type.reference.id})
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-bg-base">
      <div className="flex items-center gap-2 border-b border-border bg-bg-muted px-3 py-1.5">
        <Link2 className="h-3 w-3 text-text-muted" aria-hidden="true" />
        <span className="font-mono text-xs font-semibold text-text-primary">
          {inner.name ?? inner.id}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {Object.entries(inner.properties).map(([propName, prop]) => (
          <SchemaPropertyRow
            key={prop.id}
            name={propName}
            prop={prop}
            visited={new Set(visited).add(type.reference.id)}
          />
        ))}
      </ul>
      {Object.keys(inner.properties).length === 0 ? (
        <p className="px-3 py-3 text-xs italic text-text-muted">
          Referenced schema has no properties.
        </p>
      ) : null}
    </div>
  );
}