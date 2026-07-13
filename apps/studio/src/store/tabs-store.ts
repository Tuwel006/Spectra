"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { operationKey } from "@/lib/tree";
import type { HttpMethod, Identifier } from "@spectra/core";

/**
 * Tab — represents a single open endpoint in the workspace centre.
 *
 * Tabs remember:
 *  - Body type, request body content, header overrides, auth state
 *  - Pinned state (pinned tabs are protected from `closeAllExceptPinned`)
 *  - Dirty flag (unsaved edits)
 */
export interface Tab {
  readonly id: string;
  readonly pathId: Identifier;
  readonly method: HttpMethod;
  readonly url: string;
  readonly title: string;
  readonly pinned: boolean;
  readonly dirty: boolean;
  readonly bodyType: BodyType;
  readonly requestBody: string;
  readonly authToken: string;
  readonly customHeaders: ReadonlyArray<[string, string]>;
}

export type BodyType =
  | "none"
  | "json"
  | "form-data"
  | "url-encoded"
  | "binary"
  | "raw"
  | "graphql";

interface TabsState {
  readonly tabs: readonly Tab[];
  readonly activeTabId: string | null;
  readonly scrollPositions: Readonly<Record<string, number>>;

  openTab: (input: {
    pathId: Identifier;
    method: HttpMethod;
    url: string;
    title: string;
  }) => void;
  closeTab: (id: string) => void;
  closeOthers: (id: string) => void;
  closeAll: () => void;
  setActive: (id: string) => void;
  togglePin: (id: string) => void;
  nextTab: () => void;
  prevTab: () => void;

  updateTab: (id: string, patch: Partial<Tab>) => void;
  rememberScroll: (id: string, top: number) => void;
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      scrollPositions: {},

      openTab: ({ pathId, method, url, title }) => {
        const id = operationKey(pathId, method);
        const existing = get().tabs.find((tab) => tab.id === id);
        if (existing) {
          set({ activeTabId: id });
          return;
        }
        const tab: Tab = {
          id,
          pathId,
          method,
          url,
          title,
          pinned: false,
          dirty: false,
          bodyType: "json",
          requestBody: "",
          authToken: "",
          customHeaders: [],
        };
        set((state) => ({
          tabs: [...state.tabs, tab],
          activeTabId: id,
        }));
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const index = tabs.findIndex((tab) => tab.id === id);
        if (index < 0) return;
        const target = tabs[index];
        if (target.pinned) return;

        const nextTabs = tabs.filter((tab) => tab.id !== id);
        let nextActive = activeTabId;
        if (activeTabId === id) {
          const fallback = nextTabs[index] ?? nextTabs[index - 1];
          nextActive = fallback ? fallback.id : null;
        }
        set({ tabs: nextTabs, activeTabId: nextActive });
      },

      closeOthers: (id) => {
        const target = get().tabs.find((tab) => tab.id === id);
        if (!target) return;
        const remaining = get().tabs.filter((tab) => tab.id === id || tab.pinned);
        set({ tabs: remaining, activeTabId: id });
      },

      closeAll: () => {
        const pinned = get().tabs.filter((tab) => tab.pinned);
        set({ tabs: pinned, activeTabId: pinned[0]?.id ?? null });
      },

      setActive: (id) => set({ activeTabId: id }),
      togglePin: (id) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, pinned: !tab.pinned } : tab,
          ),
        })),

      nextTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length < 2) return;
        const index = tabs.findIndex((tab) => tab.id === activeTabId);
        const next = tabs[(index + 1) % tabs.length];
        set({ activeTabId: next.id });
      },
      prevTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length < 2) return;
        const index = tabs.findIndex((tab) => tab.id === activeTabId);
        const prev = tabs[(index - 1 + tabs.length) % tabs.length];
        set({ activeTabId: prev.id });
      },

      updateTab: (id, patch) =>
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, ...patch, dirty: true } : tab,
          ),
        })),

      rememberScroll: (id, top) =>
        set((state) => ({
          scrollPositions: { ...state.scrollPositions, [id]: top },
        })),
    }),
    {
      name: "spectra.tabs.v1",
      partialize: (state) => ({
        tabs: state.tabs.map((tab) => ({
          ...tab,
          // Don't persist transient flags — they are computed on demand.
          dirty: false,
        })),
        activeTabId: state.activeTabId,
      }),
    },
  ),
);