import type { HttpMethod } from "@spectra/core";

/**
 * Human-readable label for an HTTP method (uppercase, e.g. "GET", "POST").
 * Trivial helper kept here so all UI layers share a single source of truth.
 */
export function methodLabel(method: HttpMethod): string {
  return method.toUpperCase();
}

/**
 * Tailwind class for the colour used to render an HTTP method badge.
 * Colours align with the design tokens in `globals.css`.
 */
export function methodClass(method: HttpMethod): string {
  switch (method) {
    case "GET":
      return "bg-method-get/15 text-method-get border-method-get/30";
    case "POST":
      return "bg-method-post/15 text-method-post border-method-post/30";
    case "PUT":
      return "bg-method-put/15 text-method-put border-method-put/30";
    case "PATCH":
      return "bg-method-patch/15 text-method-patch border-method-patch/30";
    case "DELETE":
      return "bg-method-delete/15 text-method-delete border-method-delete/30";
    case "HEAD":
      return "bg-method-head/15 text-method-head border-method-head/30";
    case "OPTIONS":
      return "bg-method-options/15 text-method-options border-method-options/30";
    default:
      return "bg-bg-muted text-text-muted border-border";
  }
}

/**
 * Tailwind class for the colour used to render an HTTP status code chip.
 */
export function statusClass(status: number): string {
  if (status >= 200 && status < 300) return "text-status-2xx";
  if (status >= 300 && status < 400) return "text-status-3xx";
  if (status >= 400 && status < 500) return "text-status-4xx";
  if (status >= 500 && status < 600) return "text-status-5xx";
  return "text-text-muted";
}