import type {
  ArrayType,
  Operation,
  PrimitiveType,
  ReferenceType,
  Response as CoreResponse,
  Schema,
  Type,
} from "@spectra/core";

import { TypeKind } from "@spectra/core";

import { mockDocumentation } from "@/mock/documentation";

/* ------------------------------------------------------------------ */
/* Status code helpers                                                  */
/* ------------------------------------------------------------------ */

/** Status codes that are typically considered "successful". */
export const SUCCESS_STATUSES: readonly string[] = [
  "200", "201", "202", "203", "204", "205", "206",
];

/** Categorise a status code as 1xx/2xx/3xx/4xx/5xx. */
export type StatusFamily = "1xx" | "2xx" | "3xx" | "4xx" | "5xx" | "default";

export function familyOf(status: string): StatusFamily {
  const code = parseInt(status, 10);
  if (!Number.isFinite(code)) return "default";
  if (code < 200) return "1xx";
  if (code < 300) return "2xx";
  if (code < 400) return "3xx";
  if (code < 500) return "4xx";
  return "5xx";
}

export function isSuccess(status: string): boolean {
  return SUCCESS_STATUSES.includes(status);
}

/* ------------------------------------------------------------------ */
/* Response view modes                                                  */
/* ------------------------------------------------------------------ */

export const RESPONSE_VIEW_MODES = [
  "pretty",
  "raw",
  "preview",
  "schema",
  "examples",
] as const;

export type ResponseViewMode = (typeof RESPONSE_VIEW_MODES)[number];

export const RESPONSE_VIEW_LABEL: Record<ResponseViewMode, string> = {
  pretty: "Pretty",
  raw: "Raw",
  preview: "Preview",
  schema: "Schema",
  examples: "Example",
};

export const RESPONSE_INFO_TABS = [
  "headers",
  "cookies",
  "metadata",
  "timeline",
] as const;

export type ResponseInfoTab = (typeof RESPONSE_INFO_TABS)[number];

export const RESPONSE_INFO_LABEL: Record<ResponseInfoTab, string> = {
  headers: "Headers",
  cookies: "Cookies",
  metadata: "Metadata",
  timeline: "Timeline",
};

/* ------------------------------------------------------------------ */
/* Documented responses for an operation                                */
/* ------------------------------------------------------------------ */

export interface ResponseEntry {
  /** Status code as a string, e.g. `"200"`, `"404"`. */
  readonly status: string;
  /** Numeric status code for sorting. */
  readonly numericStatus: number;
  readonly family: StatusFamily;
  readonly response: CoreResponse;
  /** Schema name referenced by the body, if any. */
  readonly schemaName: string | undefined;
}

/**
 * Return all documented responses for an operation, sorted by status
 * code (ascending). Skips malformed entries where the key isn't a
 * numeric status code.
 */
export function collectResponses(op: Operation): readonly ResponseEntry[] {
  const entries: ResponseEntry[] = [];
  for (const [key, value] of Object.entries(op.responses)) {
    if (!value) continue;
    const numeric = parseInt(key, 10);
    if (!Number.isFinite(numeric)) continue;
    entries.push({
      status: key,
      numericStatus: numeric,
      family: familyOf(key),
      response: value,
      schemaName: firstSchemaName(value),
    });
  }
  entries.sort((a, b) => a.numericStatus - b.numericStatus);
  return entries;
}

function firstSchemaName(response: CoreResponse): string | undefined {
  const body = response.body;
  if (!body) return undefined;
  for (const media of Object.values(body.content)) {
    if (media?.schema?.id) return media.schema.id;
  }
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Schema lookup                                                        */
/* ------------------------------------------------------------------ */

export function lookupSchema(name: string | undefined): Schema | undefined {
  if (!name) return undefined;
  return mockDocumentation.components.schemas[name];
}

/* ------------------------------------------------------------------ */
/* Example payload synthesis                                             */
/* ------------------------------------------------------------------ */

/**
 * Walk a schema and produce a placeholder JSON value matching its
 * shape. Used to render an example payload when the operation doesn't
 * ship a real one. Deterministic — same input always produces same
 * output so React renders stay stable.
 */
export function synthesizeExample(schemaName: string, depth = 0): unknown {
  if (depth > 6) return null;
  const schema = lookupSchema(schemaName);
  if (!schema) return `<${schemaName}>`;
  const out: Record<string, unknown> = {};
  for (const [propName, prop] of Object.entries(schema.properties)) {
    out[propName] = placeholderFor(prop.valueType, propName, depth);
  }
  return out;
}

function placeholderFor(
  type: Type,
  propName: string,
  depth: number,
): unknown {
  switch (type.kind) {
    case TypeKind.PRIMITIVE:
      return primitivePlaceholder((type as PrimitiveType).name, propName);
    case TypeKind.REFERENCE: {
      const ref = (type as ReferenceType).reference;
      const inner = lookupSchema(ref.id);
      if (!inner) return `<${ref.id}>`;
      return synthesizeExample(ref.id, depth + 1);
    }
    case TypeKind.ARRAY:
      return [
        placeholderFor((type as ArrayType).elementType, propName, depth + 1),
      ];
  }
}

function primitivePlaceholder(name: string, propName: string): unknown {
  switch (name) {
    case "string":
      return `string`;
    case "number":
      return 0;
    case "boolean":
      return false;
    case "bigint":
      return 0;
    case "null":
      return null;
    default:
      return `<${propName}>`;
  }
}

/* ------------------------------------------------------------------ */
/* Response examples                                                     */
/* ------------------------------------------------------------------ */

export interface ResponseExample {
  readonly id: string;
  readonly name: string;
  readonly description: string | undefined;
  readonly body: unknown;
  readonly headers: Readonly<Record<string, string>>;
}

/**
 * Build a single example per documented status code. If the operation
 * has multiple status codes we still keep one example per status — the
 * viewer shows one at a time.
 */
export function collectResponseExamples(
  op: Operation,
): readonly ResponseExample[] {
  return collectResponses(op).map((entry) => {
    const schemaName = entry.schemaName;
    return {
      id: `${op.id}:${entry.status}`,
      name: `${entry.status} ${describeFamily(entry.family)}`,
      description: entry.response.description,
      body: schemaName ? synthesizeExample(schemaName) : null,
      headers: exampleHeadersFor(entry),
    };
  });
}

function exampleHeadersFor(entry: ResponseEntry): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {};
  for (const h of entry.response.headers) {
    if (!h.name) continue;
    headers[h.name] = h.description ?? h.schemaId ?? "";
  }
  // Add a Content-Type for media types that include a body.
  if (entry.response.body) {
    for (const ct of Object.keys(entry.response.body.content)) {
      if (!headers["Content-Type"]) headers["Content-Type"] = ct;
    }
  }
  return headers;
}

function describeFamily(family: StatusFamily): string {
  switch (family) {
    case "2xx":
      return "Success";
    case "3xx":
      return "Redirect";
    case "4xx":
      return "Client Error";
    case "5xx":
      return "Server Error";
    case "1xx":
      return "Informational";
    default:
      return "Default";
  }
}

/* ------------------------------------------------------------------ */
/* Status code → tone colour                                            */
/* ------------------------------------------------------------------ */

export function statusTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const fam = familyOf(status);
  switch (fam) {
    case "2xx":
      return "success";
    case "3xx":
      return "info";
    case "4xx":
      return "warning";
    case "5xx":
      return "danger";
    default:
      return "neutral";
  }
}

/* ------------------------------------------------------------------ */
/* Default response flag                                                 */
/* ------------------------------------------------------------------ */

export function isDefaultResponse(status: string): boolean {
  return status === "default";
}