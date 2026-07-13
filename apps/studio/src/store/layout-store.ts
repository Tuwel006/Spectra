"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Layout state — controls the resizable panel sizes and the collapsed
 * state of each sidebar.
 *
 * Persisted to `localStorage` so the user's preferred layout survives
 * page reloads. Numerical sizes are percentages because the underlying
 * `react-resizable-panels` library works in percentages.
 */
export interface LayoutState {
  readonly leftSidebarWidth: number;
  readonly rightSidebarWidth: number;
  readonly leftCollapsed: boolean;
  readonly rightCollapsed: boolean;
  readonly bottomConsoleHeight: number;
  readonly bottomConsoleVisible: boolean;

  setLeftSidebarWidth: (size: number) => void;
  setRightSidebarWidth: (size: number) => void;
  setBottomConsoleHeight: (size: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomConsole: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      leftSidebarWidth: 22,
      rightSidebarWidth: 26,
      bottomConsoleHeight: 24,
      leftCollapsed: false,
      rightCollapsed: true,
      bottomConsoleVisible: false,

      setLeftSidebarWidth: (size) =>
        set({ leftSidebarWidth: clamp(size, 14, 45) }),
      setRightSidebarWidth: (size) =>
        set({ rightSidebarWidth: clamp(size, 18, 45) }),
      setBottomConsoleHeight: (size) =>
        set({ bottomConsoleHeight: clamp(size, 12, 70) }),
      toggleLeftSidebar: () =>
        set((state) => ({ leftCollapsed: !state.leftCollapsed })),
      toggleRightSidebar: () =>
        set((state) => ({ rightCollapsed: !state.rightCollapsed })),
      toggleBottomConsole: () =>
        set((state) => ({ bottomConsoleVisible: !state.bottomConsoleVisible })),
    }),
    {
      name: "spectra.layout.v1",
    },
  ),
);

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}