"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Layout store — owns the application shell's panel geometry.
 *
 * Sizes are expressed in percentages because `react-resizable-panels`
 * works in percentages. Collapse state is stored alongside so the shell
 * can render collapsed panels at a fixed narrow width.
 *
 * Persisted to `localStorage` under `spectra.layout.v3` so the user's
 * preferred layout survives reloads. Bumped from v2 after widening
 * defaults — older keys with smaller widths are ignored.
 */
export interface LayoutState {
  /** Width of the left sidebar in % of the horizontal PanelGroup. */
  readonly leftWidth: number;
  /** Width of the right sidebar in % of the horizontal PanelGroup. */
  readonly rightWidth: number;
  /** Height of the bottom panel in % of the vertical PanelGroup. */
  readonly bottomHeight: number;

  /** Whether the left sidebar is collapsed (rendered as a slim rail). */
  readonly leftCollapsed: boolean;
  /** Whether the right sidebar is collapsed (rendered as a slim rail). */
  readonly rightCollapsed: boolean;
  /** Whether the bottom panel is expanded (otherwise a thin strip). */
  readonly bottomOpen: boolean;

  setLeftWidth: (size: number) => void;
  setRightWidth: (size: number) => void;
  setBottomHeight: (size: number) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: () => void;
}

const clamp = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

/**
 * SSR-safe localStorage wrapper. Returns `null` on the server so
 * zustand's `persist` middleware can serialise initial state without
 * crashing during Next.js prerendering.
 */
const storage = createJSONStorage<LayoutState>(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return window.localStorage;
});

export const useLayout = create<LayoutState>()(
  persist(
    (set) => ({
      // Widened defaults — both sidebars at 26% so every route in the
      // Explorer / Schemas panel is readable without scrolling, and
      // the central workspace still has 48% of the viewport.
      leftWidth: 26,
      rightWidth: 26,
      bottomHeight: 28,

      leftCollapsed: false,
      rightCollapsed: false,
      bottomOpen: false,

      // Wider clamps so the drag handle can both shrink toward the
      // minimum (14%) and stretch past the default up to 50% on
      // ultrawide displays.
      setLeftWidth: (size) => set({ leftWidth: clamp(size, 14, 50) }),
      setRightWidth: (size) => set({ rightWidth: clamp(size, 14, 50) }),
      setBottomHeight: (size) => set({ bottomHeight: clamp(size, 12, 70) }),

      toggleLeft: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
      toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
      toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
    }),
    {
      name: "spectra.layout.v3",
      storage,
    },
  ),
);

/**
 * Width, in percent, that a collapsed sidebar panel occupies.
 *
 * Set to `0` so the panel fully disappears when collapsed — the toggle
 * button that re-opens it lives in a floating layer over the workspace
 * (see `SidebarToggle` in `AppLayout.tsx`) rather than inside the panel
 * itself, so it stays visible regardless of the panel's width.
 */
export const COLLAPSED_RAIL_SIZE = 0;