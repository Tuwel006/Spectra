"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mockDocumentation } from "@/mock/documentation";
import type { Operation } from "@spectra/core";

import type { WorkspaceTab } from "../types/Workspace";

/* ------------------------------------------------------------------ */
/* Per-tab UI state                                                    */
/* ------------------------------------------------------------------ */

/**
 * Collapsible sections inside an endpoint workspace page.
 *
 * The names match the design (Documentation / Request / Response).
 * Each tab carries its own expansion state so switching tabs doesn't
 * reset what the user was looking at.
 */
export type WorkspaceSectionId = "documentation" | "request" | "response";

export interface WorkspaceUiSlice {
  /** Per-section expand/collapse. */
  readonly sections: Readonly<Record<WorkspaceSectionId, boolean>>;
  /** Scroll position (px) preserved per tab — switched tabs snap
   *  back to where the user left them. */
  readonly scrollY: number;
  /** Selected request sub-tab (params / query / headers / …). */
  readonly requestTab: string;
  /** Selected response sub-tab (documentation / runtime). */
  readonly responseTab: string;
}

function defaultUiSlice(): WorkspaceUiSlice {
  return {
    sections: {
      documentation: true,
      request: true,
      response: true,
    },
    scrollY: 0,
    requestTab: "params",
    responseTab: "documentation",
  };
}

/* ------------------------------------------------------------------ */
/* State contract                                                      */
/* ------------------------------------------------------------------ */

/**
 * Workspace tab store.
 *
 * The strip is a flat ordered list (not a `Map`) so insertion order
 * matches the visible order. Mutators keep the `activeTabId` invariant
 * — it always references an id that's currently in `tabs`.
 *
 * Resource types are deliberately generic on the `WorkspaceTab`
 * discriminator. Today only `endpoint` resources produce tabs; schema /
 * response / parameter / requestBody / example tabs land in later
 * phases, but their state plumbing is already in place.
 *
 * Persisted to `localStorage` under `spectra.workspace.v3`. SSR is
 * handled with a no-op storage shim and a `useHasMounted()` helper so
 * the server render stays in sync with the first client paint.
 */
export interface WorkspaceState {
  readonly tabs: readonly WorkspaceTab[];
  readonly activeTabId: string | null;
  /** Per-tab UI state (expanded sections, scroll, sub-tabs). */
  readonly ui: Readonly<Record<string, WorkspaceUiSlice>>;

  /** Add a tab if no tab exists for the same resource; otherwise just
   *  activate the existing one. Idempotent. */
  openTab: (tab: WorkspaceTab) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
  closeOthers: (id: string) => void;
  closeAll: () => void;
  reorderTab: (id: string, toIndex: number) => void;
  setDirty: (id: string, dirty: boolean) => void;
  togglePin: (id: string) => void;

  /** Toggle / set a section's expanded state for a given tab. */
  setSectionExpanded: (
    tabId: string,
    section: WorkspaceSectionId,
    expanded: boolean,
  ) => void;
  toggleSection: (tabId: string, section: WorkspaceSectionId) => void;

  /** Persist scroll position per tab. */
  setScrollY: (tabId: string, y: number) => void;

  /** Persist the selected request / response sub-tab per tab. */
  setRequestTab: (tabId: string, requestTab: string) => void;
  setResponseTab: (tabId: string, responseTab: string) => void;
}

/* ------------------------------------------------------------------ */
/* SSR-safe persistence                                                 */
/* ------------------------------------------------------------------ */

/** SSR-safe localStorage shim — returns `null` server-side. */
const tabsStorage = createJSONStorage<WorkspaceState>(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
});

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Pick the next active tab after closing one.
 *
 *   • Last tab → `null`
 *   • Closing the right-most → fall back to the left neighbour
 *   • Otherwise → the right neighbour (like Chrome / VS Code)
 */
function pickNextTabId(
  tabs: readonly WorkspaceTab[],
  closedId: string,
): string | null {
  if (tabs.length === 0) return null;
  if (tabs.length === 1) return null;
  const idx = tabs.findIndex((t) => t.id === closedId);
  if (idx < 0) return tabs[tabs.length - 1]!.id;
  if (idx === tabs.length - 1) return tabs[idx - 1]!.id;
  return tabs[idx + 1]!.id;
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      tabs: [],
      activeTabId: null,
      ui: {},

      openTab: (tab) =>
        set((state) => {
          // Idempotent — clicking an already-open resource just makes
          // its tab active.
          const existing = state.tabs.find(
            (t) =>
              t.resourceType === tab.resourceType &&
              t.resourceId === tab.resourceId,
          );
          if (existing) return { activeTabId: existing.id };
          return {
            tabs: [...state.tabs, tab],
            activeTabId: tab.id,
            ui: { ...state.ui, [tab.id]: defaultUiSlice() },
          };
        }),

      closeTab: (id) =>
        set((state) => {
          const exists = state.tabs.some((t) => t.id === id);
          if (!exists) return state;
          const nextTabs = state.tabs.filter((t) => t.id !== id);
          const wasActive = state.activeTabId === id;
          const nextActive = wasActive
            ? pickNextTabId(state.tabs, id)
            : state.activeTabId;
          // Drop the per-tab UI state too so memory doesn't grow.
          const nextUi = { ...state.ui };
          delete nextUi[id];
          return { tabs: nextTabs, activeTabId: nextActive, ui: nextUi };
        }),

      activateTab: (id) =>
        set((state) => {
          if (!state.tabs.some((t) => t.id === id)) return state;
          if (state.activeTabId === id) return state;
          return { activeTabId: id };
        }),

      closeOthers: (id) =>
        set((state) => {
          const keep = state.tabs.filter((t) => t.id === id);
          if (keep.length === 0) return state;
          if (
            keep.length === state.tabs.length &&
            state.activeTabId === id
          ) {
            return state;
          }
          const nextUi: Record<string, WorkspaceUiSlice> = {};
          if (state.ui[id]) nextUi[id] = state.ui[id]!;
          return { tabs: keep, activeTabId: id, ui: nextUi };
        }),

      closeAll: () => set({ tabs: [], activeTabId: null, ui: {} }),

      reorderTab: (id, toIndex) =>
        set((state) => {
          const from = state.tabs.findIndex((t) => t.id === id);
          if (from < 0) return state;
          if (from === toIndex) return state;
          const copy = [...state.tabs];
          const [moved] = copy.splice(from, 1);
          if (!moved) return state;
          const clamped = Math.max(0, Math.min(toIndex, copy.length));
          copy.splice(clamped, 0, moved);
          return { tabs: copy };
        }),

      setDirty: (id, dirty) =>
        set((state) => {
          let changed = false;
          const nextTabs = state.tabs.map((t) => {
            if (t.id !== id || t.dirty === dirty) return t;
            changed = true;
            return { ...t, dirty };
          });
          return changed ? { tabs: nextTabs } : state;
        }),

      togglePin: (id) =>
        set((state) => {
          let changed = false;
          const nextTabs = state.tabs.map((t) => {
            if (t.id !== id) return t;
            changed = true;
            return { ...t, pinned: !t.pinned };
          });
          return changed ? { tabs: nextTabs } : state;
        }),

      setSectionExpanded: (tabId, section, expanded) =>
        set((state) => {
          const current = state.ui[tabId] ?? defaultUiSlice();
          if (current.sections[section] === expanded) return state;
          return {
            ui: {
              ...state.ui,
              [tabId]: {
                ...current,
                sections: { ...current.sections, [section]: expanded },
              },
            },
          };
        }),

      toggleSection: (tabId, section) =>
        set((state) => {
          const current = state.ui[tabId] ?? defaultUiSlice();
          return {
            ui: {
              ...state.ui,
              [tabId]: {
                ...current,
                sections: {
                  ...current.sections,
                  [section]: !current.sections[section],
                },
              },
            },
          };
        }),

      setScrollY: (tabId, y) =>
        set((state) => {
          const current = state.ui[tabId] ?? defaultUiSlice();
          if (current.scrollY === y) return state;
          return {
            ui: { ...state.ui, [tabId]: { ...current, scrollY: y } },
          };
        }),

      setRequestTab: (tabId, requestTab) =>
        set((state) => {
          const current = state.ui[tabId] ?? defaultUiSlice();
          if (current.requestTab === requestTab) return state;
          return {
            ui: {
              ...state.ui,
              [tabId]: { ...current, requestTab },
            },
          };
        }),

      setResponseTab: (tabId, responseTab) =>
        set((state) => {
          const current = state.ui[tabId] ?? defaultUiSlice();
          if (current.responseTab === responseTab) return state;
          return {
            ui: {
              ...state.ui,
              [tabId]: { ...current, responseTab },
            },
          };
        }),
    }),
    {
      name: "spectra.workspace.v3",
      storage: tabsStorage,
      partialize: (state) => state,
    },
  ),
);

/* ------------------------------------------------------------------ */
/* Static resolution helpers                                          */
/* ------------------------------------------------------------------ */

/** All known operation ids, computed once from the bundled mock. */
let operationIdsCache: ReadonlySet<string> | null = null;
function getOperationIds(): ReadonlySet<string> {
  if (operationIdsCache !== null) return operationIdsCache;
  const ids = new Set<string>();
  for (const path of Object.values(mockDocumentation.paths)) {
    for (const op of Object.values(path.operations)) {
      if (op?.id) ids.add(op.id);
    }
  }
  operationIdsCache = ids;
  return ids;
}

/** Resolve an operation by id from the bundled documentation. */
const operationByIdCache = new Map<string, Operation | undefined>();
export function resolveOperation(endpointId: string): Operation | undefined {
  const cached = operationByIdCache.get(endpointId);
  if (cached !== undefined || operationByIdCache.has(endpointId)) {
    return cached;
  }
  for (const path of Object.values(mockDocumentation.paths)) {
    for (const op of Object.values(path.operations)) {
      if (op && op.id === endpointId) {
        operationByIdCache.set(endpointId, op);
        return op;
      }
    }
  }
  operationByIdCache.set(endpointId, undefined);
  return undefined;
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/**
 * Returns `true` once the component has mounted on the client. Use to
 * gate any UI that depends on persisted tab state so SSR and the first
 * client render match.
 */
export function useHasMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}

/** Read a tab's UI slice, defaulting to the canonical empty slice. */
export function getUiSlice(
  ui: Readonly<Record<string, WorkspaceUiSlice>>,
  tabId: string | null | undefined,
): WorkspaceUiSlice {
  if (!tabId) return defaultUiSlice();
  return ui[tabId] ?? defaultUiSlice();
}