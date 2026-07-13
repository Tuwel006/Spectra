"use client";

import { create } from "zustand";

import {
  AiPanel,
  EndpointTab,
  ExplorerSection,
  type AiPanelId,
  type EndpointTabId,
  type ExplorerSectionId,
} from "@/constants/explorer";

/**
 * Cross-cutting UI state:
 *  - Command palette visibility
 *  - Search query (shared between explorer filter and command palette)
 *  - Active explorer section
 *  - Active sub-tab inside the endpoint viewer
 *  - Active AI panel in the right sidebar
 */
interface UiState {
  readonly paletteOpen: boolean;
  readonly explorerSearch: string;
  readonly explorerSection: ExplorerSectionId;
  readonly endpointTab: EndpointTabId;
  readonly aiPanel: AiPanelId;
  readonly toasts: readonly Toast[];

  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  setExplorerSearch: (query: string) => void;
  setExplorerSection: (section: ExplorerSectionId) => void;
  setEndpointTab: (tab: EndpointTabId) => void;
  setAiPanel: (panel: AiPanelId) => void;
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

export interface Toast {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly variant: "info" | "success" | "warning" | "error";
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  explorerSearch: "",
  explorerSection: ExplorerSection.Endpoints,
  endpointTab: EndpointTab.Overview,
  aiPanel: AiPanel.Analysis,
  toasts: [],

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  setExplorerSearch: (query) => set({ explorerSearch: query }),
  setExplorerSection: (section) => set({ explorerSection: section }),
  setEndpointTab: (tab) => set({ endpointTab: tab }),
  setAiPanel: (panel) => set({ aiPanel: panel }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));