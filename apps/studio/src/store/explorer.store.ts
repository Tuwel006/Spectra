import { create } from "zustand";
import type { ExplorerNode, ExpansionState } from "@/types";

/**
 * Explorer store — tracks expanded nodes, search query, and selected node.
 * Keeps the explorer's stateful behaviour decoupled from its render tree.
 */
interface ExplorerStore {
  expansion: ExpansionState;
  searchQuery: string;
  selectedNodeId: string | null;

  toggleNode: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  expandAll: (nodes: readonly ExplorerNode[]) => void;
  collapseAll: () => void;
  setSearchQuery: (q: string) => void;
  setSelectedNode: (id: string | null) => void;
}

/** Recursively collect all node ids for expandAll. */
function collectIds(nodes: readonly ExplorerNode[]): string[] {
  return nodes.flatMap((n) => [n.id, ...collectIds(n.children ?? [])]);
}

export const useExplorerStore = create<ExplorerStore>()((set) => ({
  expansion: {},
  searchQuery: "",
  selectedNodeId: null,

  toggleNode: (nodeId) =>
    set((s) => ({
      expansion: { ...s.expansion, [nodeId]: !s.expansion[nodeId] },
    })),

  expandNode: (nodeId) =>
    set((s) => ({ expansion: { ...s.expansion, [nodeId]: true } })),

  collapseNode: (nodeId) =>
    set((s) => ({ expansion: { ...s.expansion, [nodeId]: false } })),

  expandAll: (nodes) => {
    const ids = collectIds(nodes);
    const expansion: ExpansionState = {};
    for (const id of ids) expansion[id] = true;
    set({ expansion });
  },

  collapseAll: () => set({ expansion: {} }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setSelectedNode: (id) => set({ selectedNodeId: id }),
}));
