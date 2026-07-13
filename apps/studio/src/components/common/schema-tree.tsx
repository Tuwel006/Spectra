"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui";
import type { NamedCollection, Property, Schema } from "@spectra/core";

interface SchemaTreeProps {
  readonly schemas: NamedCollection<Schema>;
  readonly rootSchemaId: string;
  readonly visited?: Set<string>;
}

/**
 * Recursive JSON-Schema-like viewer.
 *
 * Resolves `$ref`-style references by walking the `schemas` registry.
 * Prevents infinite recursion via a `visited` set.
 */
export function SchemaTree({ schemas, rootSchemaId, visited }: SchemaTreeProps) {
  const seen = visited ?? new Set<string>();
  if (seen.has(rootSchemaId)) {
    return (
      <span className="font-mono text-xs text-text-muted">↻ {rootSchemaId}</span>
    );
  }
  const schema = schemas[rootSchemaId];
  if (!schema) {
    return (
      <span className="font-mono text-xs text-status-4xx">
        Unresolved schema: {rootSchemaId}
      </span>
    );
  }

  return (
    <SchemaNode schema={schema} schemas={schemas} visited={new Set(seen).add(rootSchemaId)} />
  );
}

interface SchemaNodeProps {
  readonly schema: Schema;
  readonly schemas: NamedCollection<Schema>;
  readonly visited: Set<string>;
}

function SchemaNode({ schema, schemas, visited }: SchemaNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const entries = Object.entries(schema.properties);
  if (entries.length === 0) {
    return (
      <span className="font-mono text-xs text-text-muted">empty object</span>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center gap-1 self-start rounded px-1 text-xs font-semibold text-text-primary hover:bg-bg-muted"
      >
        {expanded ? (
          <ChevronDown className="size-3" aria-hidden />
        ) : (
          <ChevronRight className="size-3" aria-hidden />
        )}
        {schema.name ?? schema.id}
        <Badge variant="subtle">{entries.length}</Badge>
      </button>
      {expanded ? (
        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {entries.map(([name, property]) => (
            <PropertyRow
              key={property.id}
              name={name}
              property={property}
              schemas={schemas}
              visited={visited}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface PropertyRowProps {
  readonly name: string;
  readonly property: Property;
  readonly schemas: NamedCollection<Schema>;
  readonly visited: Set<string>;
}

function PropertyRow({ name, property, schemas, visited }: PropertyRowProps) {
  const rendered = renderType(property, schemas, visited);
  const modifierPills = (
    <span className="ml-1 inline-flex gap-1">
      {property.modifiers.required ? (
        <Badge variant="accent">required</Badge>
      ) : null}
      {property.modifiers.nullable ? (
        <Badge variant="subtle">nullable</Badge>
      ) : null}
      {property.modifiers.readonly ? (
        <Badge variant="subtle">readonly</Badge>
      ) : null}
      {property.modifiers.deprecated ? (
        <Badge variant="default" className="border-status-4xx/40 text-status-4xx">
          deprecated
        </Badge>
      ) : null}
    </span>
  );

  return (
    <div className="flex flex-col gap-1 py-0.5">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <span className="font-mono font-semibold text-text-primary">{name}</span>
        <span className="text-text-muted">:</span>
        {rendered.kind === "primitive" ? (
          <span className="font-mono text-accent">{rendered.label}</span>
        ) : null}
        {rendered.kind === "array" ? (
          <span className="font-mono text-accent">
            {rendered.label}
            {rendered.element}
          </span>
        ) : null}
        {rendered.kind === "reference" ? (
          <span className="font-mono text-accent">{rendered.label}</span>
        ) : null}
        {modifierPills}
      </div>
      {rendered.kind === "reference" ? (
        <div className="ml-2 border-l border-border pl-3">
          <SchemaTree
            schemas={schemas}
            rootSchemaId={rendered.targetId}
            visited={visited}
          />
        </div>
      ) : null}
      {rendered.kind === "array" && rendered.elementKind === "reference" ? (
        <div className="ml-2 border-l border-border pl-3">
          <SchemaTree
            schemas={schemas}
            rootSchemaId={rendered.elementTargetId ?? ""}
            visited={visited}
          />
        </div>
      ) : null}
      {property.description ? (
        <p className="ml-1 text-xs text-text-muted">{property.description}</p>
      ) : null}
    </div>
  );
}

type Rendered =
  | { kind: "primitive"; label: string }
  | {
      kind: "array";
      label: string;
      element: ReactNode;
      elementKind: "primitive" | "reference" | "unknown";
      elementTargetId?: string;
    }
  | { kind: "reference"; label: string; targetId: string };

function renderType(
  property: Property,
  schemas: NamedCollection<Schema>,
  visited: Set<string>,
): Rendered {
  const valueType = property.valueType;
  if (valueType.kind === "primitive") {
    return { kind: "primitive", label: valueType.name };
  }
  if (valueType.kind === "reference") {
    return {
      kind: "reference",
      label: valueType.reference.id,
      targetId: valueType.reference.id,
    };
  }
  if (valueType.kind === "array") {
    const element = valueType.elementType;
    if (element.kind === "primitive") {
      return {
        kind: "array",
        label: "array",
        elementKind: "primitive",
        element: <span className="font-mono text-accent">&lt;{element.name}&gt;</span>,
      };
    }
    if (element.kind === "reference") {
      return {
        kind: "array",
        label: "array",
        elementKind: "reference",
        elementTargetId: element.reference.id,
        element: (
          <span className="font-mono text-accent">&lt;{element.reference.id}&gt;</span>
        ),
      };
    }
    if (element.kind === "array") {
      return {
        kind: "array",
        label: "array",
        elementKind: "unknown",
        element: <span className="font-mono text-accent">&lt;array&gt;</span>,
      };
    }
  }
  return { kind: "primitive", label: "unknown" };
}