"use client";

import * as React from "react";

import type { Operation } from "@spectra/core";

import type { WorkspaceTab } from "../types/Workspace";
import { resolveOperation, useWorkspaceStore } from "../store/workspaceStore";

/* ------------------------------------------------------------------ */
/* Public hook                                                         */
/* ------------------------------------------------------------------ */

export interface UseWorkspaceResult {
  /** Ordered list of open tabs. */
  readonly tabs: readonly WorkspaceTab[];
  /** Currently active tab id, or `null` when no tabs are open. */
  readonly activeTabId: string | null;
  /** Currently active tab object, or `null` when no tabs are open. */
  readonly activeTab: WorkspaceTab | null;

  /** True when no tab is open. The shell uses this to swap the
   *  workspace body for the Welcome screen. */
  readonly isEmpty: boolean;

  /** Open a tab (idempotent — activates the existing tab if the same
   *  resource is already open). */
  readonly openTab: (tab: WorkspaceTab) => void;
  /** Close a tab by id. Auto-activates the nearest remaining tab. */
  readonly closeTab: (id: string) => void;
  /** Make a tab the active one. No-op if the id is unknown. */
  readonly activateTab: (id: string) => void;
  /** Close every tab except the given id. */
  readonly closeOthers: (id: string) => void;
  /** Close every tab. */
  readonly closeAll: () => void;
  /** Reorder a tab — used by drag & drop (Phase 5). */
  readonly reorderTab: (id: string, toIndex: number) => void;
  /** Mark a tab as dirty / clean. */
  readonly setDirty: (id: string, dirty: boolean) => void;
  /** Pin / unpin a tab. */
  readonly togglePin: (id: string) => void;
}

/**
 * Public hook for the workspace shell.
 *
 * Mirrors `useWorkspaceStore` but exposes a derived `activeTab` and
 * `isEmpty` flag so consumers don't need to recompute them. Subscribe
 * to this hook from anywhere inside the workspace tree — Explorer code
 * should never reach into the workspace store directly.
 */
export function useWorkspace(): UseWorkspaceResult {
  const tabs = useWorkspaceStore((s) => s.tabs);
  const activeTabId = useWorkspaceStore((s) => s.activeTabId);
  const openTab = useWorkspaceStore((s) => s.openTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const activateTab = useWorkspaceStore((s) => s.activateTab);
  const closeOthers = useWorkspaceStore((s) => s.closeOthers);
  const closeAll = useWorkspaceStore((s) => s.closeAll);
  const reorderTab = useWorkspaceStore((s) => s.reorderTab);
  const setDirty = useWorkspaceStore((s) => s.setDirty);
  const togglePin = useWorkspaceStore((s) => s.togglePin);

  return React.useMemo<UseWorkspaceResult>(
    () => ({
      tabs,
      activeTabId,
      activeTab: tabs.find((t) => t.id === activeTabId) ?? null,
      isEmpty: tabs.length === 0,
      openTab,
      closeTab,
      activateTab,
      closeOthers,
      closeAll,
      reorderTab,
      setDirty,
      togglePin,
    }),
    [
      tabs,
      activeTabId,
      openTab,
      closeTab,
      activateTab,
      closeOthers,
      closeAll,
      reorderTab,
      setDirty,
      togglePin,
    ],
  );
}

/* ------------------------------------------------------------------ */
/* Resolver hook — pulls the live Operation for the active endpoint tab */
/* ------------------------------------------------------------------ */

export interface UseResolvedWorkspaceTabResult {
  readonly tab: WorkspaceTab | null;
  readonly operation: Operation | undefined;
  readonly isReady: boolean;
}

/**
 * Resolve the active workspace tab against the mock documentation.
 *
 * The tab itself is what the store tracks; the resolver reaches into
 * the bundled `mockDocumentation` to attach the live `Operation` (and
 * later `Schema` / `Response` / …) so view components don't have to.
 *
 * Returns `isReady: false` during SSR / first paint to gate any UI
 * that would otherwise hydration-mismatch.
 */
export function useResolvedWorkspaceTab(
  mounted: boolean,
): UseResolvedWorkspaceTabResult {
  const activeTab = useWorkspaceStore((s) =>
    s.tabs.find((t) => t.id === s.activeTabId) ?? null,
  );

  const operation = React.useMemo<Operation | undefined>(() => {
    if (!activeTab || activeTab.resourceType !== "endpoint") return undefined;
    return resolveOperation(activeTab.resourceId);
  }, [activeTab]);

  return React.useMemo(
    () => ({
      tab: activeTab,
      operation,
      isReady: mounted,
    }),
    [activeTab, operation, mounted],
  );
}