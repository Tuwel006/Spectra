"use client";

/**
 * SSR-safe localStorage shim for libraries (e.g. `useDefaultLayout`)
 * that default to the global `localStorage` which doesn't exist during
 * Next.js prerendering.
 */
const ssrSafeStorage: Storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

/** Returns `window.localStorage` in the browser, a no-op shim on the server. */
export function getSafeStorage(): Storage {
  return typeof window === "undefined" ? ssrSafeStorage : window.localStorage;
}