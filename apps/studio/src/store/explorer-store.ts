"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Explorer interaction state.
 *
 * The actual documentation data is loaded from `@/mock/documentation`.
 * This store only tracks the user's *interaction* with the tree:
 *  - expanded nodes
 *  - favourite operations
 *  - recently opened operations
 */
const MAX_RECENT = 12;

interface ExplorerState {
  readonly expandedNodes: Readonly<Record<string, boolean>>;
  readonly favorites: readonly string[];
  readonly recents: readonly string[];

  toggleNode: (id: string) => void;
  setExpanded: (id: string, expanded: boolean) => void;
  expandAll: (ids: readonly string[]) => void;
  collapseAll: () => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  pushRecent: (id: string) => void;
}

export const useExplorerStore = create<ExplorerState>()(
  persist(
    (set, get) => ({
      expandedNodes: {},
      favorites: [],
      recents: [],

      toggleNode: (id) =>
        set((state) => ({
          expandedNodes: { ...state.expandedNodes, [id]: !state.expandedNodes[id] },
        })),
      setExpanded: (id, expanded) =>
        set((state) => ({
          expandedNodes: { ...state.expandedNodes, [id]: expanded },
        })),
      expandAll: (ids) =>
        set(() => ({
          expandedNodes: ids.reduce<Record<string, boolean>>((acc, id) => {
            acc[id] = true;
            return acc;
          }, {}),
        })),
      collapseAll: () => set({ expandedNodes: {} }),

      isFavorite: (id) => get().favorites.includes(id),
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favorite) => favorite !== id)
            : [id, ...state.favorites],
        })),

      pushRecent: (id) =>
        set((state) => ({
          recents: [id, ...state.recents.filter((recent) => recent !== id)].slice(
            0,
            MAX_RECENT,
          ),
        })),
    }),
    {
      name: "spectra.explorer.v1",
    },
  ),
);