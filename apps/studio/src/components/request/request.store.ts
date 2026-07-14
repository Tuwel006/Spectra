"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  draftFromOperation,
  emptyDraft,
  type AuthConfig,
  type BodyType,
  type DraftField,
  type KeyValueRow,
  type MultipartField,
  type RequestCookie,
  type RequestDraft,
  type RequestHeaderRow,
  type RequestParam,
} from "./request.types";

/**
 * Per-endpoint request drafts.
 *
 * <p>
 *   Keyed by `endpointId` (the operation id) so each open endpoint tab
 *   keeps its own parameters / body / authorization independent of the
 *   others. Persisted to `localStorage` (`spectra.requests.v1`).
 * </p>
 *
 * <p>
 *   Mutations are split by field so editors can subscribe to just the
 *   slice they care about — fewer rerenders when typing into a single
 *   textarea.
 * </p>
 */
export interface RequestDraftState {
  readonly drafts: Readonly<Record<string, RequestDraft>>;
  readonly environment: "development" | "staging" | "production" | "mock";

  ensureDraft: (endpointId: string, op?: unknown) => void;
  patchDraft: (
    endpointId: string,
    field: DraftField,
    value: unknown,
  ) => void;
  resetDraft: (endpointId: string) => void;
  setEnvironment: (env: RequestDraftState["environment"]) => void;
}

const noopStorage = () => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
};

export const useRequestDraftStore = create<RequestDraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      environment: "development",

      ensureDraft: (endpointId) =>
        set((state) => {
          if (state.drafts[endpointId]) return state;
          return {
            drafts: {
              ...state.drafts,
              [endpointId]: emptyDraft(),
            },
          };
        }),

      patchDraft: (endpointId, field, value) =>
        set((state) => {
          const current = state.drafts[endpointId];
          if (!current) return state;
          const next: RequestDraft = { ...current, [field]: value } as RequestDraft;
          return {
            drafts: { ...state.drafts, [endpointId]: next },
          };
        }),

      resetDraft: (endpointId) =>
        set((state) => {
          const next = { ...state.drafts };
          delete next[endpointId];
          return { drafts: next };
        }),

      setEnvironment: (env) => set({ environment: env }),
    }),
    {
      name: "spectra.requests.v1",
      storage: createJSONStorage<RequestDraftState>(() => noopStorage()),
      // Persist the full state — drafts and environment.
    },
  ),
);

/**
 * Build a draft from the operation metadata. Convenience wrapper used
 * by `RequestEditor` to seed a fresh draft on first open.
 */
export function initializeDraftFromOperation(
  endpointId: string,
  op: Parameters<typeof draftFromOperation>[0],
): void {
  useRequestDraftStore.setState((state) => {
    if (state.drafts[endpointId]) return state;
    return {
      drafts: { ...state.drafts, [endpointId]: draftFromOperation(op) },
    };
  });
}

/**
 * Subscribe to a single endpoint's draft. Returns `undefined` on the
 * server so SSR doesn't ship rows that disappear on hydrate.
 */
export function useDraft(endpointId: string | undefined): RequestDraft | undefined {
  return useRequestDraftStore((state) =>
    endpointId ? state.drafts[endpointId] : undefined,
  );
}

/* ------------------------------------------------------------------ */
/* Mount-flag helper (kept here so the editor stays self-contained)   */
/* ------------------------------------------------------------------ */

export function useRequestMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/* ------------------------------------------------------------------ */
/* Type re-exports for editors                                        */
/* ------------------------------------------------------------------ */

export type {
  AuthConfig,
  BodyType,
  KeyValueRow,
  MultipartField,
  RequestCookie,
  RequestDraft,
  RequestHeaderRow,
  RequestParam,
} from "./request.types";
