import type {
  HttpMethod,
  Operation,
} from "@spectra/core";

/* ------------------------------------------------------------------ */
/* Body                                                                */
/* ------------------------------------------------------------------ */

export const BODY_TYPES = [
  "json",
  "raw",
  "xml",
  "form-data",
  "url-encoded",
  "binary",
  "graphql",
] as const;

export type BodyType = (typeof BODY_TYPES)[number];

export const BODY_TYPE_LABEL: Record<BodyType, string> = {
  json: "JSON",
  raw: "Raw Text",
  xml: "XML",
  "form-data": "Multipart Form",
  "url-encoded": "URL-Encoded",
  binary: "Binary",
  graphql: "GraphQL",
};

export const BODY_TYPE_CONTENT_TYPE: Record<BodyType, string> = {
  json: "application/json",
  raw: "text/plain",
  xml: "application/xml",
  "form-data": "multipart/form-data",
  "url-encoded": "application/x-www-form-urlencoded",
  binary: "application/octet-stream",
  graphql: "application/json",
};

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const AUTH_TYPES = [
  "no-auth",
  "bearer",
  "basic",
  "apiKey",
  "oauth2",
  "jwt",
] as const;

export type AuthType = (typeof AUTH_TYPES)[number];

export interface AuthConfig {
  readonly type: AuthType;
  readonly token?: string;
  readonly username?: string;
  readonly password?: string;
  readonly apiKeyName?: string;
  readonly apiKeyValue?: string;
  readonly apiKeyIn: "header" | "query";
  readonly jwtAlgo?: "HS256" | "RS256";
}

/* ------------------------------------------------------------------ */
/* Parameters / Headers / Cookies                                      */
/* ------------------------------------------------------------------ */

/**
 * Single editable row. Path params don't carry an `enabled` flag because
 * they're always on — the field is included so the row shape is
 * uniform across the four tables.
 */
export interface RequestParam {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
  readonly enabled: boolean;
}

export interface RequestHeaderRow {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly description?: string;
  readonly enabled: boolean;
}

export interface RequestCookie {
  readonly id: string;
  readonly name: string;
  readonly value: string;
  readonly description?: string;
}

/* ------------------------------------------------------------------ */
/* Body drafts                                                         */
/* ------------------------------------------------------------------ */

export interface MultipartField {
  readonly id: string;
  readonly key: string;
  /** Free-text value for text fields. */
  readonly value: string;
  readonly kind: "text" | "file";
  /** File name + size, only meaningful for `kind === "file"`. */
  readonly fileName?: string;
  readonly fileSize?: number;
  readonly enabled: boolean;
}

export interface KeyValueRow {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly enabled: boolean;
}

/* ------------------------------------------------------------------ */
/* Per-tab draft                                                       */
/* ------------------------------------------------------------------ */

export interface RequestDraft {
  readonly pathParams: readonly RequestParam[];
  readonly queryParams: readonly RequestParam[];
  readonly headers: readonly RequestHeaderRow[];
  readonly cookies: readonly RequestCookie[];
  readonly bodyType: BodyType;
  readonly bodyText: string;
  readonly multipartFields: readonly MultipartField[];
  readonly urlEncoded: readonly KeyValueRow[];
  readonly authorization: AuthConfig;
  readonly selectedExampleId: string | undefined;
}

/* ------------------------------------------------------------------ */
/* Edits                                                               */
/* ------------------------------------------------------------------ */

export type DraftField =
  | "pathParams"
  | "queryParams"
  | "headers"
  | "cookies"
  | "bodyType"
  | "bodyText"
  | "multipartFields"
  | "urlEncoded"
  | "authorization"
  | "selectedExampleId";

/* ------------------------------------------------------------------ */
/* Operation-derived view                                              */
/* ------------------------------------------------------------------ */

/**
 * Pre-flattened view of a `Parameter` with the bits that are useful in
 * the request editor. Built once per `Operation` and passed down so the
 * tables don't have to reach into the core model.
 */
export interface ParamHint {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string;
  readonly example?: string;
}

/**
 * Read the request-side metadata off an `Operation` and shape it for the
 * editor. Pure function — keeps the tables free of `@spectra/core`.
 */
export function collectParamHints(
  op: Operation,
): {
  readonly pathParams: readonly ParamHint[];
  readonly queryParams: readonly ParamHint[];
  readonly headers: readonly RequestHeaderRow[];
  readonly bodySchemaId: string | undefined;
  readonly bodyContentTypes: readonly string[];
  readonly examples: readonly RequestExample[];
  readonly consumes: readonly string[];
  readonly produces: readonly string[];
  readonly contentType: string | undefined;
} {
  const toHint = (
    id: string,
    name?: string,
    desc?: string,
    schemaId?: string,
    required = false,
  ): ParamHint => ({
    id,
    name: name ?? id,
    type: schemaId ?? "string",
    required,
    description: desc,
  });

  return {
    pathParams: op.request.pathParameters.map((p) =>
      toHint(p.id, p.name, p.description, p.schemaId, p.required),
    ),
    queryParams: op.request.queryParameters.map((p) =>
      toHint(p.id, p.name, p.description, p.schemaId, p.required),
    ),
    headers: op.request.headers.map((h) => ({
      id: h.id,
      name: h.name ?? h.id,
      value: "",
      description: h.description,
      enabled: true,
    })),
    bodySchemaId: undefined,
    bodyContentTypes: [],
    examples: extractExamples(op),
    consumes: extractAccepts(op),
    produces: extractProduces(op),
    contentType: inferContentType(op),
  };
}

/* ------------------------------------------------------------------ */
/* Examples                                                            */
/* ------------------------------------------------------------------ */

export interface RequestExample {
  readonly id: string;
  readonly name: string;
  readonly method: HttpMethod | undefined;
  readonly url: string | undefined;
  readonly requestBody: unknown;
  readonly requestHeaders?: Readonly<Record<string, string>>;
  readonly responseBody: unknown;
  readonly responseStatus?: number;
}

function extractExamples(op: Operation): readonly RequestExample[] {
  const ext = op.extensions ?? {};
  const raw = ext["x-example"];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const requestBody = "request" in obj ? obj.request : undefined;
    const responseBody = "response" in obj ? obj.response : undefined;
    return [
      {
        id: `${op.id}-default`,
        name: "Default example",
        method: op.method,
        url: undefined,
        requestBody,
        responseBody,
      },
    ];
  }
  return [];
}

function extractAccepts(_op: Operation): readonly string[] {
  // The mock doesn't encode `consumes` separately; body content types
  // live on `request.body.content`. Reserved here for the OpenAPI
  // provider.
  return [];
}

function extractProduces(op: Operation): readonly string[] {
  const out = new Set<string>();
  for (const resp of Object.values(op.responses)) {
    if (!resp?.body) continue;
    for (const ct of Object.keys(resp.body.content)) out.add(ct);
  }
  return [...out];
}

function inferContentType(op: Operation): string | undefined {
  if (!op.request.body) return undefined;
  const keys = Object.keys(op.request.body.content);
  return keys[0];
}

/* ------------------------------------------------------------------ */
/* Empty / defaults                                                    */
/* ------------------------------------------------------------------ */

export function emptyDraft(): RequestDraft {
  return {
    pathParams: [],
    queryParams: [],
    headers: [],
    cookies: [],
    bodyType: "json",
    bodyText: "",
    multipartFields: [],
    urlEncoded: [],
    authorization: { type: "no-auth", apiKeyIn: "header" },
    selectedExampleId: undefined,
  };
}

/**
 * Build a draft from operation metadata. Called when a request editor is
 * first opened for an endpoint — doesn't overwrite an existing draft
 * (the store handles that).
 */
export function draftFromOperation(op: Operation): RequestDraft {
  const hints = collectParamHints(op);
  const headers: RequestHeaderRow[] = hints.headers.map((h) => ({
    id: h.id,
    name: h.name,
    value: h.description ?? "",
    description: h.description,
    enabled: true,
  }));
  // Add a default Accept header if any response defines a body.
  if (hints.produces.length > 0 && !headers.some((h) => h.name.toLowerCase() === "accept")) {
    headers.push({
      id: "hdr-accept-default",
      name: "Accept",
      value: hints.produces[0] ?? "*/*",
      enabled: true,
      description: "Default Accept header inferred from response media types.",
    });
  }

  // Pick a sensible default body. JSON if the schema is referenced,
  // otherwise none.
  const bodyType: BodyType = hints.bodyContentTypes.includes("application/json")
    ? "json"
    : hints.contentType === "multipart/form-data"
      ? "form-data"
      : hints.contentType === "application/x-www-form-urlencoded"
        ? "url-encoded"
        : hints.contentType === "application/xml"
          ? "xml"
          : "json";

  return {
    pathParams: hints.pathParams.map((p) => ({
      id: p.id,
      name: p.name,
      value: "",
      type: p.type,
      required: p.required,
      description: p.description,
      enabled: true,
    })),
    queryParams: hints.queryParams.map((p) => ({
      id: p.id,
      name: p.name,
      value: "",
      type: p.type,
      required: p.required,
      description: p.description,
      enabled: true,
    })),
    headers,
    cookies: [],
    bodyType,
    bodyText: defaultBodyFor(bodyType),
    multipartFields: bodyType === "form-data"
      ? [{ id: "mpf-1", key: "", value: "", kind: "text", enabled: true }]
      : [],
    urlEncoded: bodyType === "url-encoded"
      ? [{ id: "uve-1", key: "", value: "", enabled: true }]
      : [],
    authorization: headers.some((h) => h.name.toLowerCase() === "authorization")
      ? { type: "bearer", apiKeyIn: "header" }
      : { type: "no-auth", apiKeyIn: "header" },
    selectedExampleId: hints.examples[0]?.id,
  };
}

function defaultBodyFor(type: BodyType): string {
  switch (type) {
    case "json":
      return "{\n  \n}";
    case "xml":
      return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n  \n</root>";
    case "raw":
      return "";
    case "graphql":
      return "# GraphQL request here\n{\n  \n}";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/* File size helpers                                                   */
/* ------------------------------------------------------------------ */

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
