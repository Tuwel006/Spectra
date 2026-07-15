"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import type {
  ResponseInfoTab,
  ResponseViewMode,
} from "./response.types";

/**
 * Per-endpoint response viewer state.
 *
 * <p>
 *   The viewer is bound to an endpoint id (the operation id). Each open
 *   endpoint keeps its own selected status, view mode and selected
 *   example independently — so swapping tabs doesn't reset what the
 *   user was inspecting.
 * </p>
 *
 * <p>
 *   Persisted to `localStorage` under `spectra.responses.v1`. Expanded
 *   JSON paths are deliberately NOT persisted — they reset per session
 *   to keep the storage payload small.
 * </p>
 */

export interface ResponseViewerSlice {
  readonly viewMode: ResponseViewMode;
  readonly selectedStatus: string | undefined;
  readonly selectedExampleId: string | undefined;
  readonly infoTab: ResponseInfoTab;
  readonly expandedAll: boolean;
  readonly search: string;
}

export interface ResponseViewerState {
  /** Status code selected when the user first opens a status picker. */
  readonly initialStatus: string | undefined;

  /** Map of endpointId → response viewer slice. */
  readonly slices: Readonly<Record<string, ResponseViewerSlice>>;

  setViewMode: (endpointId: string, mode: ResponseViewMode) => void;
  setSelectedStatus: (endpointId: string, status: string) => void;
  setSelectedExample: (endpointId: string, exampleId: string | undefined) => void;
  setInfoTab: (endpointId: string, tab: ResponseInfoTab) => void;
  setExpandedAll: (endpointId: string, expanded: boolean) => void;
  setSearch: (endpointId: string, search: string) => void;
  /** Initial status that should be used for `endpointId` next time. */
  setInitialStatus: (status: string | undefined) => void;
  /** Reset a single endpoint's slice. */
  resetSlice: (endpointId: string) => void;
}

function emptySlice(): ResponseViewerSlice {
  return {
    viewMode: "pretty",
    selectedStatus: undefined,
    selectedExampleId: undefined,
    infoTab: "headers",
    expandedAll: true,
    search: "",
  };
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

export const useResponseViewerStore = create<ResponseViewerState>()(
  persist(
    (set) => ({
      initialStatus: undefined,
      slices: {},

      setViewMode: (endpointId, mode) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.viewMode === mode) return state;
          return {
            slices: {
              ...state.slices,
              [endpointId]: { ...current, viewMode: mode },
            },
          };
        }),

      setSelectedStatus: (endpointId, status) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.selectedStatus === status) {
            return { initialStatus: status };
          }
          return {
            initialStatus: status,
            slices: {
              ...state.slices,
              [endpointId]: { ...current, selectedStatus: status },
            },
          };
        }),

      setSelectedExample: (endpointId, exampleId) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.selectedExampleId === exampleId) return state;
          return {
            slices: {
              ...state.slices,
              [endpointId]: { ...current, selectedExampleId: exampleId },
            },
          };
        }),

      setInfoTab: (endpointId, tab) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.infoTab === tab) return state;
          return {
            slices: {
              ...state.slices,
              [endpointId]: { ...current, infoTab: tab },
            },
          };
        }),

      setExpandedAll: (endpointId, expanded) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.expandedAll === expanded) return state;
          return {
            slices: {
              ...state.slices,
              [endpointId]: { ...current, expandedAll: expanded },
            },
          };
        }),

      setSearch: (endpointId, search) =>
        set((state) => {
          const current = state.slices[endpointId] ?? emptySlice();
          if (current.search === search) return state;
          return {
            slices: {
              ...state.slices,
              [endpointId]: { ...current, search },
            },
          };
        }),

      setInitialStatus: (status) =>
        set((state) =>
          state.initialStatus === status ? state : { initialStatus: status },
        ),

      resetSlice: (endpointId) =>
        set((state) => {
          if (!(endpointId in state.slices)) return state;
          const next = { ...state.slices };
          delete next[endpointId];
          return { slices: next };
        }),
    }),
    {
      name: "spectra.responses.v1",
      storage: createJSONStorage<ResponseViewerState>(() => noopStorage()),
    },
  ),
);

/**
 * Subscribe to a single endpoint's response viewer slice. Returns the
 * default slice on the server so SSR doesn't ship a stale row.
 *
 * Uses `useShallow` so the snapshot reference is stable across renders.
 * Without it, the `emptySlice()` fallback returns a new object on every
 * selector call and Zustand's `Object.is` check loops forever.
 */
export function useResponseSlice(
  endpointId: string | undefined,
): ResponseViewerSlice {
  return useResponseViewerStore(
    useShallow((state) =>
      endpointId ? state.slices[endpointId] ?? emptySlice() : emptySlice(),
    ),
  );
}

/* ------------------------------------------------------------------ */
/* Mount-flag helper                                                     */
/* ------------------------------------------------------------------ */

export function useResponseMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}