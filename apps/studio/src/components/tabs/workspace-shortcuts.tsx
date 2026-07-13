"use client";

import { useTabsStore } from "@/store/tabs-store";
import { useUiStore } from "@/store/ui-store";
import { useShortcut } from "@/lib/keyboard";

/**
 * Mounts global keyboard shortcuts related to the workspace:
 *   - Ctrl/Cmd + K    → open command palette
 *   - Ctrl/Cmd + W    → close active tab
 *   - Ctrl/Cmd + Tab  → cycle tabs
 *   - Ctrl/Cmd + 1..9 → jump to tab by index
 */
export function WorkspaceShortcuts() {
  const openPalette = useUiStore((state) => state.openPalette);
  const closeActiveTab = useTabsStore((state) => state.closeTab);
  const nextTab = useTabsStore((state) => state.nextTab);
  const prevTab = useTabsStore((state) => state.prevTab);
  const tabs = useTabsStore((state) => state.tabs);
  const activeTabId = useTabsStore((state) => state.activeTabId);
  const setActive = useTabsStore((state) => state.setActive);

  useShortcut("mod+k", () => openPalette());
  useShortcut("mod+w", () => {
    if (activeTabId) closeActiveTab(activeTabId);
  });

  useShortcut("mod+Tab", () => nextTab());
  useShortcut("mod+shift+Tab", () => prevTab());

  // Number shortcuts (mod+1 .. mod+9)
  for (let i = 1; i <= 9; i += 1) {
    // Capture by index — useShortcut re-binds on each render, which is fine.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useShortcut(`mod+${i}`, () => {
      const target = tabs[i - 1];
      if (target) setActive(target.id);
    });
  }

  return null;
}