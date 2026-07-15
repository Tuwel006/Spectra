"use client";

import type {
  ArrayType,
  PrimitiveType,
  Property,
  ReferenceType,
  Schema,
  Type,
} from "@spectra/core";
import { PrimitiveTypeName, TypeKind } from "@spectra/core";

import { mockDocumentation } from "@/mock/documentation";

/* ------------------------------------------------------------------ */
/* Type inference                                                      */
/* ------------------------------------------------------------------ */

/**
 * UI-level field type. Drives the renderer in {@link SmartForm}.
 * The mapping is based on:
 *   • The schema's primitive name
 *   • The property's `name` (used to recognise email / password / uri)
 *   • The property's array wrapping
 */
export type SmartFieldKind =
  | "string"
  | "text"
  | "number"
  | "integer"
  | "boolean"
  | "enum"
  | "string-list"
  | "select"
  | "multi-select"
  | "object"
  | "object-list"
  | "file"
  | "file-list"
  | "date"
  | "date-time"
  | "email"
  | "password"
  | "uri";

/**
 * Resolve a {@link Property}'s UI field type. The lookup walks the
 * property's value type and falls back to the property's name when
 * the schema doesn't explicitly tag it.
 */
export function inferFieldKind(
  property: Property,
  resolveReference: (id: string) => Schema | undefined,
): SmartFieldKind {
  const vt = property.valueType;
  const name = (property.name ?? property.id ?? "").toLowerCase();

  if (vt.kind === TypeKind.ARRAY) {
    const elem = (vt as ArrayType).elementType;
    if (elem.kind === TypeKind.PRIMITIVE) {
      const pname = (elem as PrimitiveType).name;
      if (pname === PrimitiveTypeName.STRING) return "string-list";
      if (pname === PrimitiveTypeName.NUMBER)
        return "string-list"; // could be a number list — treat as strings for the demo
      return "string-list";
    }
    if (elem.kind === TypeKind.REFERENCE) {
      const refSchema = resolveReference((elem as ReferenceType).reference.id);
      if (refSchema && looksLikeFileSchema(refSchema)) return "file-list";
      return "object-list";
    }
    return "string-list";
  }

  if (vt.kind === TypeKind.PRIMITIVE) {
    const pname = (vt as PrimitiveType).name;
    if (pname === PrimitiveTypeName.BOOLEAN) return "boolean";
    if (pname === PrimitiveTypeName.NUMBER) return "number";
    if (pname === PrimitiveTypeName.STRING) {
      if (name === "email") return "email";
      if (name === "password") return "password";
      if (name === "uri" || name === "url" || name === "website") return "uri";
      if (name === "date") return "date";
      if (name === "datetime" || name === "date-time" || name === "timestamp")
        return "date-time";
      // Long text heuristic: ends in "description", "body", "content",
      // "notes", "summary" — render as textarea.
      if (
        /description|body|content|notes|summary|bio|comment/.test(name) &&
        name.length > 10
      ) {
        return "text";
      }
      return "string";
    }
  }

  if (vt.kind === TypeKind.REFERENCE) {
    const refSchema = resolveReference((vt as ReferenceType).reference.id);
    if (refSchema && looksLikeFileSchema(refSchema)) return "file";
    if (refSchema && isEnumLike(refSchema)) return "enum";
    return "object";
  }

  return "string";
}

/**
 * Best-effort enum detection — schema has no explicit `enum` kind
 * today, so we treat any schema whose properties are empty and whose
 * `id` ends with "Enum" (or similar) as an enum source.
 */
function isEnumLike(schema: Schema): boolean {
  if (Object.keys(schema.properties).length > 0) return false;
  return /enum$/i.test(schema.id ?? "") || /role|status|kind|type/i.test(schema.id ?? "");
}

/**
 * File-upload detection — schemas named like `File*` or `*Upload*` are
 * treated as file references.
 */
function looksLikeFileSchema(schema: Schema): boolean {
  return /^file|^upload/i.test(schema.id ?? "");
}

/* ------------------------------------------------------------------ */
/* Default value helpers                                               */
/* ------------------------------------------------------------------ */

/**
 * Resolve the default value for a new property — used when the smart
 * form first renders so users see an empty input rather than `undefined`.
 */
export function defaultValueFor(kind: SmartFieldKind): unknown {
  switch (kind) {
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    case "string-list":
    case "object-list":
    case "file-list":
      return [];
    case "object":
      return {};
    case "date":
    case "date-time":
      return "";
    case "enum":
    case "select":
    case "multi-select":
      return "";
    default:
      return "";
  }
}

/**
 * Build the initial value for a schema — every property gets its
 * type-appropriate default. Used when the user toggles the SmartForm
 * on for an endpoint that doesn't have a body yet.
 */
export function buildInitialValue(
  schema: Schema,
  resolveReference: (id: string) => Schema | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const property of Object.values(schema.properties)) {
    const key = property.name ?? property.id;
    out[key] = defaultValueFor(inferFieldKind(property, resolveReference));
  }
  return out;
}

/**
 * Default reference resolver — walks the bundled mock documentation.
 * The SmartForm is decoupled from the mock module, so consumers can
 * pass a different resolver if they swap in a real provider.
 */
export function defaultResolveReference(id: string): Schema | undefined {
  return mockDocumentation.components.schemas[id];
}

/* ------------------------------------------------------------------ */
/* JSON round-trip                                                     */
/* ------------------------------------------------------------------ */

/**
 * Parse a JSON string into the shape the SmartForm expects. Returns
 * `null` for empty / invalid input so the form can render an empty
 * state instead of throwing.
 */
export function parseJsonSafe(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Stringify the SmartForm value back into a JSON body string. Two-
 * space indent, no trailing newline so the Monaco editor cursor sits
 * at the end of the closing brace.
 */
export function stringifyJsonSafe(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

/* ------------------------------------------------------------------ */
/* Re-exports for the SmartForm component                              */
/* ------------------------------------------------------------------ */

export type { Property, Schema, Type };
