import type { HttpMethod } from "@spectra/core";

/**
 * Consistent colour tokens for HTTP methods used across the explorer, tabs and
 * endpoint header. Each entry gives Tailwind utility classes so callers never
 * hardcode colour strings directly in components.
 */
export const HTTP_METHOD_CONFIG: Record<
  HttpMethod,
  { label: string; className: string; bgClassName: string; textClassName: string }
> = {
  GET:     { label: "GET",     className: "text-green-500",   bgClassName: "bg-green-500/10",   textClassName: "text-green-500" },
  POST:    { label: "POST",    className: "text-amber-500",   bgClassName: "bg-amber-500/10",   textClassName: "text-amber-500" },
  PUT:     { label: "PUT",     className: "text-blue-500",    bgClassName: "bg-blue-500/10",    textClassName: "text-blue-500" },
  PATCH:   { label: "PATCH",   className: "text-purple-500",  bgClassName: "bg-purple-500/10",  textClassName: "text-purple-500" },
  DELETE:  { label: "DELETE",  className: "text-red-500",     bgClassName: "bg-red-500/10",     textClassName: "text-red-500" },
  HEAD:    { label: "HEAD",    className: "text-teal-500",    bgClassName: "bg-teal-500/10",    textClassName: "text-teal-500" },
  OPTIONS: { label: "OPTIONS", className: "text-gray-500",    bgClassName: "bg-gray-500/10",    textClassName: "text-gray-500" },
  TRACE:   { label: "TRACE",   className: "text-pink-500",    bgClassName: "bg-pink-500/10",    textClassName: "text-pink-500" },
  CONNECT: { label: "CONNECT", className: "text-orange-500",  bgClassName: "bg-orange-500/10",  textClassName: "text-orange-500" },
} as const;

/**
 * Consistent colour tokens for HTTP status codes.
 */
export function getStatusCodeConfig(code: number): {
  label: string;
  className: string;
} {
  if (code >= 200 && code < 300) return { label: `${code}`, className: "text-green-500" };
  if (code >= 300 && code < 400) return { label: `${code}`, className: "text-amber-500" };
  if (code >= 400 && code < 500) return { label: `${code}`, className: "text-orange-500" };
  return { label: `${code}`, className: "text-red-500" };
}

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 500;
export const SIDEBAR_DEFAULT_WIDTH = 280;
export const RIGHT_SIDEBAR_DEFAULT_WIDTH = 320;
