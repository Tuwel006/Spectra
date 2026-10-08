"use client";

import * as React from "react";

import type { Documentation, Operation } from "@spectra/core";

import { useDocumentationContext } from "@/lib/documentationContext";
import { useRequestDraftStore } from "@/components/request";
import { resolveActiveServerUrl, useUrlStore } from "./urlStore";

/* ------------------------------------------------------------------ */
/* URL resolution                                                      */
/* ------------------------------------------------------------------ */

/**
 * Resolve the path URL for a given operation. Walks the supplied
 * documentation's paths once per call so it stays correct when the
 * active documentation reloads.
 */
export function resolveOperationUrl(
  opId: string,
  doc: Documentation,
): string {
  for (const path of Object.values(doc.paths)) {
    for (const op of Object.values(path.operations)) {
      if (op?.id === opId) return path.url;
    }
  }
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
  /** Server base URL. Resolved from the URL store — either the user
   *  picked server from the docs or the custom override. */
  readonly serverUrl: string;
  /** Path template with `{var}` placeholders. */
  readonly path: string;
  /** Substituted full URL — updates whenever path / query params
   *  change in the draft store. */
  readonly url: string;
  /** Selected server id (from the docs) — `undefined` when the user
   *  is on a custom URL. */
  readonly serverId: string | undefined;
  /** `true` when the user is overriding with a custom URL. */
  readonly isCustom: boolean;
  /** Display label for the active server (e.g. `"Production"` or the
   *  raw URL when on a custom one). Useful for the URL bar's server
   *  chip caption. */
  readonly serverLabel: string;
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
  const { documentation } = useDocumentationContext();
  const endpointId = operation.id;
  const path = React.useMemo(
    () => (documentation ? resolveOperationUrl(endpointId, documentation) : ""),
    [documentation, endpointId],
  );

  // Active server URL — reads from the URL store (server picker +
  // custom URL override). Re-runs only when the store changes.
  const urlState = useUrlStore();
  const servers = documentation?.servers ?? [];
  const resolvedServer = React.useMemo(
    () => resolveActiveServerUrl(urlState, servers),
    [urlState, servers],
  );
  const serverUrl = resolvedServer.url;
  const serverId = resolvedServer.serverId;
  const isCustom = resolvedServer.isCustom;

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

  // Friendly label for the active server — used by the URL bar's
  // server chip so users see "Production" rather than the raw URL.
  const serverLabel = React.useMemo(() => {
    if (isCustom) return serverUrl;
    const match = servers.find((s) => s.id === serverId);
    return match?.name ?? serverUrl;
  }, [isCustom, serverId, serverUrl, servers]);

  return { serverUrl, path, url, serverId, isCustom, serverLabel };
}

const EMPTY_QUERY: ReadonlyArray<{
  enabled: boolean;
  name: string;
  value: string;
}> = Object.freeze([]) as readonly { enabled: boolean; name: string; value: string }[];
