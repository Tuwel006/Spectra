import type { HttpMethod } from "@spectra/core";

/**
 * HTTP methods that, by long-standing REST convention, do NOT carry
 * a request body. Technically the HTTP spec allows a body on any
 * method, but sending one on `GET`, `HEAD`, or `OPTIONS` confuses
 * caches, proxies, and most server frameworks. We follow the
 * convention so the UI doesn't let users construct a request the
 * server will silently drop.
 *
 * `DELETE` is intentionally NOT in this list — modern REST APIs
 * routinely accept a body on DELETE for bulk operations or
 * structured delete-confirmation payloads.
 */
const BODY_LESS_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>([
  "GET",
  "HEAD",
  "OPTIONS",
]);

/**
 * True when the given HTTP method may carry a request body under
 * REST convention. False for GET / HEAD / OPTIONS.
 */
export function supportsRequestBody(method: HttpMethod): boolean {
  return !BODY_LESS_METHODS.has(method);
}