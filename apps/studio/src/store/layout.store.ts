import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SIDEBAR_DEFAULT_WIDTH, RIGHT_SIDEBAR_DEFAULT_WIDTH } from "@/constants";

/**
 * Layout store — manages panel widths, sidebar visibility, and bottom console.
 * All widths are in pixels and persisted so they survive page reloads.
 */
interface LayoutStore {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isBottomConsoleOpen: boolean;

  setLeftSidebarWidth: (w: number) => void;
  setRightSidebarWidth: (w: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomConsole: () => void;
  openLeftSidebar: () => void;
  openRightSidebar: () => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      leftSidebarWidth: SIDEBAR_DEFAULT_WIDTH,
      rightSidebarWidth: RIGHT_SIDEBAR_DEFAULT_WIDTH,
      isLeftSidebarOpen: true,
      isRightSidebarOpen: false,
      isBottomConsoleOpen: false,

      setLeftSidebarWidth: (w) => set({ leftSidebarWidth: w }),
      setRightSidebarWidth: (w) => set({ rightSidebarWidth: w }),
      toggleLeftSidebar: () =>
        set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
      toggleRightSidebar: () =>
        set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),
      toggleBottomConsole: () =>
        set((s) => ({ isBottomConsoleOpen: !s.isBottomConsoleOpen })),
      openLeftSidebar: () => set({ isLeftSidebarOpen: true }),
      openRightSidebar: () => set({ isRightSidebarOpen: true }),
    }),
    { name: "spectra-layout" }
  )
);
