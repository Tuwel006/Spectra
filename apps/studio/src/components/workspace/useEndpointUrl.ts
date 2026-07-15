"use client";

import * as React from "react";

import type { Operation } from "@spectra/core";

import { useRequestDraftStore } from "@/components/request";
import { mockDocumentation } from "@/mock/documentation";

/* ------------------------------------------------------------------ */
/* URL resolution                                                      */
/* ------------------------------------------------------------------ */

/**
 * Resolve the path URL for a given operation. Cached for repeat
 * lookups so the URL builder stays O(1) per draft change.
 */
const opUrlCache = new Map<string, string>();
export function resolveOperationUrl(opId: string): string {
  const cached = opUrlCache.get(opId);
  if (cached !== undefined) return cached;
  for (const path of Object.values(mockDocumentation.paths)) {
    for (const op of Object.values(path.operations)) {
      if (op?.id === opId) {
        opUrlCache.set(opId, path.url);
        return path.url;
      }
    }
  }
  opUrlCache.set(opId, "");
  return "";
}

/**
 * Build the full request URL by combining the server base, the path
 * with `{var}` substitutions, and the query string from the draft.
 *
 *   server   = "https://api.spectra.example.com/v1"
 *   path     = "/users/{id}/orders"
 *   params   = { id: "25" }
 *   query    = [{ enabled: true, name: "page", value: "2" }, …]
 *
 *   → "https://api.spectra.example.com/v1/users/25/orders?page=2"
 */
export function buildEndpointUrl(input: {
  serverUrl: string;
  path: string;
  pathParams: Readonly<Record<string, string>>;
  query: ReadonlyArray<{
    enabled: boolean;
    name: string;
    value: string;
  }>;
}): string {
  const base = stripTrailingSlash(input.serverUrl);
  const interpolated = interpolatePath(input.path, input.pathParams);
  const qs = buildQueryString(input.query);
  return qs ? `${base}${interpolated}?${qs}` : `${base}${interpolated}`;
}

/**
 * Replace every `{name}` token in the path with the matching param
 * value, or leave it as `{name}` if no value is set. This matches
 * Postman's behaviour so users see exactly which params are still
 * missing.
 */
function interpolatePath(
  path: string,
  params: Readonly<Record<string, string>>,
): string {
  return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const v = params[key];
    if (v && v.length > 0) return encodeURIComponent(v);
    return `{${key}}`;
  });
}

function buildQueryString(
  query: ReadonlyArray<{ enabled: boolean; name: string; value: string }>,
): string {
  const parts: string[] = [];
  for (const row of query) {
    if (!row.enabled) continue;
    if (!row.name) continue;
    parts.push(
      `${encodeURIComponent(row.name)}=${encodeURIComponent(row.value)}`,
    );
  }
  return parts.join("&");
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                 */
/* ------------------------------------------------------------------ */

export interface UseEndpointUrlResult {
  /** Server base URL. The current `development` server from the mock
   *  docs — wired to the request store's environment. */
  readonly serverUrl: string;
  /** Path template with `{var}` placeholders. */
  readonly path: string;
  /** Substituted full URL — updates whenever path / query params
   *  change in the draft store. */
  readonly url: string;
}

/**
 * Read the live URL for the active endpoint. Subscribes to the
 * request draft so the URL stays in sync as the user fills in path
 * params or toggles query params.
 *
 * Implementation note: we subscribe to the raw pathParams /
 * queryParams arrays (whose references are stable across renders —
 * the store only swaps them when an entry is added / updated) and
 * derive the URL-shape projections via `useMemo`. This avoids the
 * `getSnapshot should be cached` infinite loop we'd hit if we built
 * new objects inside the selector.
 */
export function useEndpointUrl(operation: Operation): UseEndpointUrlResult {
  const endpointId = operation.id;
  const path = resolveOperationUrl(endpointId);

  // Server lookup — for now the demo always picks the first server.
  // A future phase can read this from the request store's environment.
  const serverUrl = React.useMemo(
    () => mockDocumentation.servers[0]?.url ?? "",
    [],
  );

  // Subscribe to the raw arrays — the store keeps references stable
  // when no edit happens, so `Object.is` short-circuits without an
  // infinite loop.
  const pathParams = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.pathParams,
  );
  const queryParams = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.queryParams,
  );

  // Derive the URL-shape projections. useMemo only re-runs when one
  // of the source arrays actually changes (mutation triggers a new
  // reference in zustand).
  const pathMap = React.useMemo(() => {
    const out: Record<string, string> = {};
    if (pathParams) {
      for (const row of pathParams) {
        if (row.name) out[row.name] = row.value;
      }
    }
    return out;
  }, [pathParams]);

  const queryList = React.useMemo(() => {
    if (!queryParams) return EMPTY_QUERY;
    return queryParams
      .filter((r) => r.enabled)
      .map((r) => ({ enabled: r.enabled, name: r.name, value: r.value }));
  }, [queryParams]);

  const url = React.useMemo(
    () => buildEndpointUrl({ serverUrl, path, pathParams: pathMap, query: queryList }),
    [serverUrl, path, pathMap, queryList],
  );

  return { serverUrl, path, url };
}

const EMPTY_QUERY: ReadonlyArray<{
  enabled: boolean;
  name: string;
  value: string;
}> = Object.freeze([]) as readonly { enabled: boolean; name: string; value: string }[];