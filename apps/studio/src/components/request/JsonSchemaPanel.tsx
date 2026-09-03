"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  FileCode2,
  Hash,
  List,
  ToggleLeft,
  Type as TypeIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { ArrayType, Property, ReferenceType, Schema, Type } from "@spectra/core";
import { TypeKind } from "@spectra/core";

import {
  defaultResolveReference,
  inferFieldKind,
  type SmartFieldKind,
} from "@/components/workspace/smartFormInference";

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */

/**
 * Read-only reference card for a body {@link Schema}.
 *
 * <p>
 *   Sits above the JSON editor in {@link RequestBody} so the user
 *   can see the field names, types, and required/optional flags
 *   of the API's expected body while they edit raw JSON. The panel
 *   is collapsible — clicking the header chevron toggles the field
 *   list with a smooth height transition.
 * </p>
 */
export function JsonSchemaPanel({
  schema,
  resolveReference = defaultResolveReference,
  defaultOpen = true,
}: {
  schema: Schema;
  resolveReference?: (id: string) => Schema | undefined;
  defaultOpen?: boolean;
}): React.ReactElement {
  const [open, setOpen] = React.useState(defaultOpen);
  const properties = React.useMemo(
    () => Object.values(schema.properties),
    [schema],
  );
  const requiredCount = React.useMemo(
    () => properties.filter((p) => p.modifiers?.required).length,
    [properties],
  );
  const hasDeprecated = React.useMemo(
    () => properties.some((p) => p.modifiers?.deprecated),
    [properties],
  );

  return (
    <section
      aria-label={`Body schema: ${schema.name ?? schema.id}`}
      className={cn(
        "flex min-h-0 flex-col rounded-md border border-border/70 bg-bg-subtle/40",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`schema-panel-${schema.id}`}
        className={cn(
          "flex shrink-0 items-center gap-3 px-3 py-2 text-left transition-colors",
          "hover:bg-bg-muted/50",
        )}
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-subtle text-accent">
          <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Body schema
            </span>
            <span className="truncate font-mono text-xs font-semibold text-text-primary">
              {schema.name ?? schema.id}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone="subtle" size="xs">
            {properties.length} {properties.length === 1 ? "field" : "fields"}
          </Badge>
          {requiredCount > 0 ? (
            <Badge tone="danger" size="xs">
              {requiredCount} required
            </Badge>
          ) : null}
          {hasDeprecated ? (
            <Badge tone="warning" size="xs">
              deprecated
            </Badge>
          ) : null}
          <Tooltip content={open ? "Collapse schema" : "Expand schema"}>
            <span
              aria-hidden
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded text-text-muted transition-transform duration-200",
                open && "rotate-0",
                !open && "-rotate-180",
              )}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </span>
          </Tooltip>
        </div>
      </button>

      <div
        id={`schema-panel-${schema.id}`}
        className={cn(
          "grid min-h-0 overflow-hidden border-border/60 transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-3">
            {schema.description ? (
              <p className="mb-2 truncate text-[11px] italic text-text-muted">
                {schema.description}
              </p>
            ) : null}
            {properties.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/70 bg-bg-base px-3 py-3 text-center text-[11px] italic text-text-muted">
                This schema has no properties.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border/40 rounded-md border border-border/60 bg-bg-base">
                {properties.map((property) => (
                  <SchemaFieldRow
                    key={property.id}
                    property={property}
                    resolveReference={resolveReference}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Field row                                                            */
/* ------------------------------------------------------------------ */

function SchemaFieldRow({
  property,
  resolveReference,
}: {
  property: Property;
  resolveReference: (id: string) => Schema | undefined;
}): React.ReactElement {
  const kind = inferFieldKind(property, resolveReference);
  const typeLabel = describeType(property.valueType, kind, resolveReference);
  const required = property.modifiers?.required ?? false;
  const deprecated = property.modifiers?.deprecated ?? false;
  const nullable = property.modifiers?.nullable ?? false;
  const readonly = property.modifiers?.readonly ?? false;
  const name = property.name ?? property.id;

  return (
    <li className="flex flex-col gap-1 px-3 py-2">
      <div className="grid items-center gap-2 grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="flex min-w-0 items-center gap-2">
          <KindIcon kind={kind} />
          <span
            className="truncate font-mono text-[12px] font-medium text-text-primary"
            title={name}
          >
            {name}
          </span>
        </div>

        <span
          className={cn(
            "truncate rounded border border-border/60 bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px]",
            typeColor(kind),
          )}
          title={typeLabel.tooltip ?? typeLabel.text}
        >
          {typeLabel.text}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {required ? (
            <Badge tone="danger" size="xs">
              required
            </Badge>
          ) : (
            <Badge tone="subtle" size="xs">
              optional
            </Badge>
          )}
          {nullable ? (
            <Tooltip content="Nullable">
              <Badge tone="subtle" size="xs">
                null
              </Badge>
            </Tooltip>
          ) : null}
          {readonly ? (
            <Tooltip content="Read-only">
              <Badge tone="info" size="xs">
                ro
              </Badge>
            </Tooltip>
          ) : null}
          {deprecated ? (
            <Badge tone="warning" size="xs">
              deprecated
            </Badge>
          ) : null}
        </div>
      </div>

      {property.description ? (
        <p
          className="ml-5 truncate text-[11px] text-text-muted"
          title={property.description}
        >
          {property.description}
        </p>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Type label helpers                                                   */
/* ------------------------------------------------------------------ */

function describeType(
  type: Type,
  kind: SmartFieldKind,
  resolveReference: (id: string) => Schema | undefined,
): { text: string; tooltip?: string } {
  if (type.kind === TypeKind.PRIMITIVE) {
    return { text: kind };
  }
  if (type.kind === TypeKind.ARRAY) {
    const elementType = (type as ArrayType).elementType;
    const elementLabel = describeType(
      elementType,
      kind === "string-list" || kind === "object-list" || kind === "file-list"
        ? stripListSuffix(kind)
        : "string",
      resolveReference,
    );
    return { text: `${elementLabel.text}[]`, tooltip: elementLabel.tooltip };
  }
  if (type.kind === TypeKind.REFERENCE) {
    const refId = (type as ReferenceType).reference.id;
    const refSchema = resolveReference(refId);
    return { text: refSchema?.name ?? refSchema?.id ?? refId };
  }
  return { text: kind };
}

function stripListSuffix(k: SmartFieldKind): SmartFieldKind {
  if (k === "string-list") return "string";
  if (k === "object-list") return "object";
  if (k === "file-list") return "file";
  return k;
}

function typeColor(kind: SmartFieldKind): string {
  switch (kind) {
    case "string":
    case "text":
    case "email":
    case "password":
    case "uri":
    case "string-list":
    case "date":
    case "date-time":
      return "text-emerald-600 dark:text-emerald-300";
    case "number":
    case "integer":
      return "text-rose-600 dark:text-rose-300";
    case "boolean":
      return "text-amber-600 dark:text-amber-300";
    case "enum":
    case "select":
    case "multi-select":
      return "text-violet-600 dark:text-violet-300";
    case "object":
    case "object-list":
      return "text-sky-600 dark:text-sky-300";
    case "file":
    case "file-list":
      return "text-text-secondary";
    default:
      return "text-text-secondary";
  }
}

function KindIcon({
  kind,
}: {
  kind: SmartFieldKind;
}): React.ReactElement {
  const className = "h-3 w-3 shrink-0 text-text-muted";
  switch (kind) {
    case "boolean":
      return <ToggleLeft className={className} aria-hidden="true" />;
    case "number":
    case "integer":
      return <Hash className={className} aria-hidden="true" />;
    case "string-list":
    case "object-list":
    case "file-list":
      return <List className={className} aria-hidden="true" />;
    case "object":
      return <FileCode2 className={className} aria-hidden="true" />;
    default:
      return <TypeIcon className={className} aria-hidden="true" />;
  }
}