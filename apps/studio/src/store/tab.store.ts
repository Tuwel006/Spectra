import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tab, EndpointEntry } from "@/types";

/**
 * Tab store — manages open tabs, active tab, and tab ordering.
 * Intentionally kept simple: no server state, purely UI state.
 */
interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;

  openTab: (endpoint: EndpointEntry) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  pinTab: (tabId: string) => void;
  unpinTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
}

const makeTabId = (endpoint: EndpointEntry): string =>
  `${endpoint.pathId}::${endpoint.method}`;

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      openTab(endpoint) {
        const id = makeTabId(endpoint);
        const existing = get().tabs.find((t) => t.id === id);
        if (existing) {
          set({ activeTabId: id });
          return;
        }
        const newTab: Tab = {
          id,
          endpoint,
          isPinned: false,
          isDirty: false,
        };
        set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: id }));
      },

      closeTab(tabId) {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex((t) => t.id === tabId);
        const pinned = tabs.find((t) => t.id === tabId)?.isPinned;
        if (pinned) return; // pinned tabs cannot be closed via regular close
        const remaining = tabs.filter((t) => t.id !== tabId);
        let nextActive = activeTabId;
        if (activeTabId === tabId) {
          // activate the tab to the left, or the right, or null
          nextActive = remaining[idx - 1]?.id ?? remaining[0]?.id ?? null;
        }
        set({ tabs: remaining, activeTabId: nextActive });
      },

      setActiveTab(tabId) {
        set({ activeTabId: tabId });
      },

      pinTab(tabId) {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, isPinned: true } : t
          ),
        }));
      },

      unpinTab(tabId) {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, isPinned: false } : t
          ),
        }));
      },

      closeOtherTabs(tabId) {
        set((s) => ({
          tabs: s.tabs.filter((t) => t.id === tabId || t.isPinned),
          activeTabId: tabId,
        }));
      },

      closeAllTabs() {
        set((s) => ({
          tabs: s.tabs.filter((t) => t.isPinned),
          activeTabId: s.tabs.find((t) => t.isPinned)?.id ?? null,
        }));
      },
    }),
    {
      name: "spectra-tabs",
      // Only persist tab list + active — not the full endpoint data (it comes from mock)
      partialize: (s) => ({ tabs: s.tabs, activeTabId: s.activeTabId }),
    }
  )
);
