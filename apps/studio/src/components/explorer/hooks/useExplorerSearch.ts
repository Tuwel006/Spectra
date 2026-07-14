"use client";

import * as React from "react";

import type {
  ExplorerComponentGroup,
  ExplorerEndpoint,
  ExplorerTagFolder,
  ExplorerTree,
} from "../types/ExplorerNode";

/* ------------------------------------------------------------------ */
/* Filtering primitives                                                */
/* ------------------------------------------------------------------ */

/**
 * Case-insensitive substring match against every searchable field.
 * Hits on path URL, summary, operation id, HTTP method and tags so
 * the user can type anything they have visible in the UI.
 */
function matchesEndpoint(
  ep: ExplorerEndpoint,
  q: string,
): boolean {
  if (ep.url.toLowerCase().includes(q)) return true;
  if (ep.summary?.toLowerCase().includes(q)) return true;
  if (ep.operationId?.toLowerCase().includes(q)) return true;
  if (ep.method.toLowerCase().includes(q)) return true;
  if (ep.tags.some((t) => t.toLowerCase().includes(q))) return true;
  return false;
}

function matchesLeafName(name: string, q: string): boolean {
  return name.toLowerCase().includes(q);
}

/**
 * Apply a case-insensitive filter to the explorer tree. A folder is
 * kept only if at least one of its descendants matches the query —
 * empty folders automatically disappear. The returned tree uses the
 * same shape as the input so the consumer can swap it in directly.
 */
export function filterExplorerTree(
  tree: ExplorerTree,
  query: string,
): ExplorerTree {
  const trimmed = query.trim();
  if (trimmed.length === 0) return tree;
  const q = trimmed.toLowerCase();

  const api: readonly ExplorerTagFolder[] = tree.api
    .map<ExplorerTagFolder | null>((folder) => {
      const kept = folder.endpoints.filter((ep) => matchesEndpoint(ep, q));
      if (kept.length === 0 && !matchesLeafName(folder.name, q)) {
        return null;
      }
      const next: ExplorerTagFolder = {
        kind: "tag-folder",
        id: folder.id,
        name: folder.name,
        endpoints: kept,
      };
      return next;
    })
    .filter((f): f is ExplorerTagFolder => f !== null);

  const components: ExplorerComponentGroup[] = [];
  for (const group of tree.components) {
    const kept = group.entries.filter((leaf) => {
      if (leaf.kind === "placeholder") return false;
      if (matchesLeafName(leaf.name, q)) return true;
      if (leaf.kind === "server" && leaf.url.toLowerCase().includes(q)) {
        return true;
      }
      return false;
    });
    const groupNameMatches = matchesLeafName(group.name, q);
    if (kept.length === 0 && !groupNameMatches) continue;
    components.push({
      kind: "component-group",
      id: group.id,
      name: group.name,
      entries: groupNameMatches ? group.entries : kept,
    });
  }

  const tags = tree.tags.filter((t) => matchesLeafName(t.name, q));
  const servers = tree.servers.filter(
    (s) =>
      matchesLeafName(s.name, q) || s.url.toLowerCase().includes(q),
  );

  return {
    ...tree,
    api,
    components,
    tags,
    servers,
  };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

/**
 * Pure filter hook. Takes a tree and a query, returns a memoised
 * filtered tree plus the helper booleans the empty state needs.
 *
 * Kept separate from `useExplorer` so consumers can plug in their
 * own state source (URL search params, debounced input, fuzzy match)
 * without duplicating the filter logic.
 */
export function useExplorerSearch(
  tree: ExplorerTree,
  query: string,
): {
  readonly tree: ExplorerTree;
  readonly isActive: boolean;
  readonly hasResults: boolean;
  readonly endpointCount: number;
} {
  const trimmed = query.trim();

  const filtered = React.useMemo(
    () => filterExplorerTree(tree, query),
    [tree, query],
  );

  const endpointCount = React.useMemo(
    () =>
      filtered.api.reduce((sum, folder) => sum + folder.endpoints.length, 0),
    [filtered.api],
  );

  const hasResults = React.useMemo(() => {
    if (endpointCount > 0) return true;
    if (filtered.components.some((g) => g.entries.length > 0)) return true;
    if (filtered.tags.length > 0) return true;
    if (filtered.servers.length > 0) return true;
    return false;
  }, [endpointCount, filtered.components, filtered.tags, filtered.servers]);

  return React.useMemo(
    () => ({
      tree: filtered,
      isActive: trimmed.length > 0,
      hasResults,
      endpointCount,
    }),
    [filtered, trimmed.length, hasResults, endpointCount],
  );
}
