"use client";

import { createContext, useContext } from "react";
import type { ReactElement, ReactNode } from "react";

import type { UseDocumentationResult } from "./documentationStore";
import { useDocumentation } from "./documentationStore";

/**
 * React context that exposes the active UseDocumentationResult
 * produced by a single DocumentationProvider at the top of the tree.
 *
 * Design intent:
 *   - Single source of truth. The provider calls useDocumentation once
 *     on mount, so every consumer re-reads the same in-memory value.
 *     Without a context, every component would re-run the localStorage
 *     hydration path and we would duplicate fetch state across the tree.
 *   - Single localStorage read. localStorage is read exactly once per
 *     page load — by the provider — not by every consumer.
 *   - Pure-function helpers. Non-React helpers (resolveOperation,
 *     resolveActiveServerUrl) cannot call hooks, so we thread the
 *     loaded Documentation through as a parameter from consumers that
 *     already have it via useDocumentationContext.
 */
const DocumentationContext = createContext<UseDocumentationResult | null>(null);

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

/**
 * Mounts useDocumentation once at the top of the tree and exposes the
 * result via useDocumentationContext. Wrap your application root with
 * this provider so every descendant can read the active documentation
 * through the same context value.
 *
 * Place it OUTSIDE the theme provider so the doc lifecycle is
 * independent of the theme lifecycle.
 */
export function DocumentationProvider({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const value = useDocumentation();
  return (
    <DocumentationContext.Provider value={value}>
      {children}
    </DocumentationContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Read the active documentation result from the nearest
 * DocumentationProvider. Throws if called outside the provider tree so
 * we never silently fall back to a stale or empty value.
 */
export function useDocumentationContext(): UseDocumentationResult {
  const ctx = useContext(DocumentationContext);
  if (ctx === null) {
    throw new Error(
        "useDocumentationContext must be used inside <DocumentationProvider>.",
    );
  }
  return ctx;
}
