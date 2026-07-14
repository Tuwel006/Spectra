"use client";

import * as React from "react";

import type { Documentation } from "@spectra/core";

import { mockDocumentation } from "@/mock/documentation";

import {
  EXPLORER_SECTION,
  type ExplorerEndpoint,
  type ExplorerLeaf,
  type ExplorerPathFolder,
  type ExplorerSchemaLeaf,
  type ExplorerSectionId,
  type ExplorerServerLeaf,
  type ExplorerTagFolder,
  type ExplorerTagLeaf,
  type ExplorerTree,
} from "../types/ExplorerNode";
import type { ExplorerState } from "../types/ExplorerState";

/* ------------------------------------------------------------------ */
/* HTTP method ordering                                                */
/* ------------------------------------------------------------------ */

const HTTP_METHODS_ORDER = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

type OrderedMethod = (typeof HTTP_METHODS_ORDER)[number];

function isOrderedMethod(method: string): method is OrderedMethod {
  return (HTTP_METHODS_ORDER as readonly string[]).includes(method);
}

/* ------------------------------------------------------------------ */
/* Documentation flattening                                            */
/* ------------------------------------------------------------------ */

/**
 * Pull the tag list attached to an operation. Stored on `extensions`
 * under the `x-tags` key (OpenAPI convention). Tolerant of missing /
 * non-array values so a malformed dataset doesn't crash the tree.
 */
function readTags(op: ExplorerEndpoint["operation"]): readonly string[] {
  const raw = op.extensions?.["x-tags"];
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string");
  }
  return [];
}

/** Stable id for an endpoint when the operation itself is missing one. */
function deriveEndpointId(path: { id: string }, method: string): string {
  return `op_${path.id}_${method.toLowerCase()}`;
}

/**
 * Walk every path → every operation and produce a flat list of rows.
 * Iterates methods in a stable order so the tree doesn't reshuffle
 * when documentation objects are rebuilt.
 */
export function flattenEndpoints(doc: Documentation): ExplorerEndpoint[] {
  const rows: ExplorerEndpoint[] = [];
  for (const path of Object.values(doc.paths)) {
    for (const method of HTTP_METHODS_ORDER) {
      const op = path.operations[method];
      if (!op) continue;
      rows.push({
        kind: "endpoint",
        id: op.id ?? deriveEndpointId(path, method),
        pathId: path.id,
        method,
        url: path.url,
        summary: op.summary,
        operationId: op.id,
        tags: readTags(op),
        operation: op,
      });
    }
    // Any methods outside the curated list (TRACE / CONNECT) are
    // surfaced too so non-standard APIs don't lose rows.
    for (const method of Object.keys(path.operations)) {
      if (isOrderedMethod(method)) continue;
      const op = path.operations[method as keyof typeof path.operations];
      if (!op) continue;
      rows.push({
        kind: "endpoint",
        id: op.id ?? deriveEndpointId(path, method),
        pathId: path.id,
        method: method as ExplorerEndpoint["method"],
        url: path.url,
        summary: op.summary,
        operationId: op.id,
        tags: readTags(op),
        operation: op,
      });
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Grouping                                                            */
/* ------------------------------------------------------------------ */

export function groupByTag(
  endpoints: readonly ExplorerEndpoint[],
  declaredTags: readonly { name: string }[],
): ExplorerTagFolder[] {
  const buckets = new Map<string, ExplorerEndpoint[]>();
  const order: string[] = declaredTags.map((t) => t.name);

  for (const name of order) buckets.set(name, []);

  for (const ep of endpoints) {
    if (ep.tags.length === 0) {
      const existing = buckets.get("Untagged") ?? [];
      buckets.set("Untagged", [...existing, ep]);
      if (!order.includes("Untagged")) order.push("Untagged");
      continue;
    }
    for (const tag of ep.tags) {
      const existing = buckets.get(tag) ?? [];
      existing.push(ep);
      buckets.set(tag, existing);
    }
  }

  const methodRank = (m: ExplorerEndpoint["method"]): number => {
    const idx = HTTP_METHODS_ORDER.indexOf(m as unknown as OrderedMethod);
    return idx === -1 ? HTTP_METHODS_ORDER.length : idx;
  };

  const sortedEntries = [...buckets.entries()]
    .filter(([, eps]) => eps.length > 0)
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  return sortedEntries.map(([name, eps]) => ({
    kind: "tag-folder" as const,
    id: `tag-folder:${name}`,
    name,
    endpoints: [...eps].sort((a, b) => {
      const byMethod = methodRank(a.method) - methodRank(b.method);
      return byMethod !== 0 ? byMethod : a.url.localeCompare(b.url);
    }),
  }));
}

function buildComponentGroups(doc: Documentation): ExplorerTree["components"] {
  const schemas = Object.values(doc.components.schemas);
  const schemaLeaves: ExplorerSchemaLeaf[] = schemas.map((s) => ({
    kind: "schema" as const,
    id: `schema:${s.id}`,
    name: s.name ?? s.id,
    description: s.description,
    schema: s,
  }));

  const placeholder = (id: string, name: string, count: number): ExplorerLeaf[] =>
    count === 0
      ? [
          {
            kind: "placeholder" as const,
            id: `${id}:empty`,
            name: `No ${name.toLowerCase()} yet`,
          },
        ]
      : [];

  return [
    {
      kind: "component-group",
      id: "components:schemas",
      name: "Schemas",
      entries: schemaLeaves,
    },
    {
      kind: "component-group",
      id: "components:responses",
      name: "Responses",
      entries: placeholder(
        "responses",
        "Responses",
        Object.keys(doc.components.responses).length,
      ),
    },
    {
      kind: "component-group",
      id: "components:parameters",
      name: "Parameters",
      entries: placeholder(
        "parameters",
        "Parameters",
        Object.keys(doc.components.parameters).length,
      ),
    },
    {
      kind: "component-group",
      id: "components:requestBodies",
      name: "Request Bodies",
      entries: placeholder(
        "requestBodies",
        "Request bodies",
        Object.keys(doc.components.requestBodies).length,
      ),
    },
  ];
}

function buildTagLeaves(doc: Documentation): ExplorerTagLeaf[] {
  return doc.tags.map((t) => ({
    kind: "tag" as const,
    id: `tag:${t.id}`,
    name: t.name,
    description: t.description,
    tag: t,
  }));
}

function buildServerLeaves(doc: Documentation): ExplorerServerLeaf[] {
  return doc.servers.map((s) => ({
    kind: "server" as const,
    id: `server:${s.id}`,
    name: s.name ?? s.url,
    url: s.url,
    description: s.description,
    server: s,
  }));
}

/* ------------------------------------------------------------------ */
/* Tree builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Convert the raw documentation into a tree shape the UI consumes.
 * Cheap enough to recompute on every change but the explorer caches
 * the result via `useMemo`, so callers don't have to worry about it.
 */
export function buildExplorerTree(doc: Documentation): ExplorerTree {
  const endpoints = flattenEndpoints(doc);
  return {
    api: groupByTag(endpoints, doc.tags),
    components: buildComponentGroups(doc),
    tags: buildTagLeaves(doc),
    servers: buildServerLeaves(doc),
    endpointCount: endpoints.length,
    pathCount: Object.keys(doc.paths).length,
  };
}

/**
 * Path-grouping helper kept here so consumers don't reach into the
 * tree builder. Used by right-click context menus / breadcrumbs.
 */
export function groupPathsByPrefix(doc: Documentation): ExplorerPathFolder[] {
  const buckets = new Map<string, string[]>();
  for (const path of Object.values(doc.paths)) {
    const seg = path.url.split("/").filter(Boolean)[0] ?? "(root)";
    const key = seg.startsWith("{") ? "Variables" : seg;
    const list = buckets.get(key) ?? [];
    list.push(path.id);
    buckets.set(key, list);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, pathIds]) => ({
      id: `path-folder:${name}`,
      name,
      pathIds,
    }));
}

/* ------------------------------------------------------------------ */
/* Toggle helper                                                       */
/* ------------------------------------------------------------------ */

function useToggle<T extends string>(
  initial: readonly T[] = [],
): {
  readonly value: ReadonlySet<T>;
  readonly toggle: (id: T) => void;
  readonly set: (ids: readonly T[]) => void;
} {
  const [value, setValue] = React.useState<ReadonlySet<T>>(
    () => new Set(initial),
  );
  const toggle = React.useCallback((id: T) => {
    setValue((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const set = React.useCallback((ids: readonly T[]) => {
    setValue(new Set(ids));
  }, []);
  return React.useMemo(() => ({ value, toggle, set }), [value, toggle, set]);
}

/* ------------------------------------------------------------------ */
/* Default documentation                                               */
/* ------------------------------------------------------------------ */

/**
 * Default module-level documentation. `Explorer.tsx` swaps this out
 * for the prop one when provided, so the rest of the tree never
 * touches `@/mock` directly.
 */
export const DEFAULT_DOCUMENTATION: Documentation = mockDocumentation;

/* ------------------------------------------------------------------ */
/* Public hook                                                         */
/* ------------------------------------------------------------------ */

export interface UseExplorerOptions {
  readonly initialSections?: readonly ExplorerSectionId[];
  readonly initialFolders?: readonly string[];
  readonly initialQuery?: string;
}

/**
 * Source of truth for the explorer's UI state. Pulls data from the
 * documentation, exposes toggle helpers for sections / folders /
 * selection, and a live `query` for the search box. Filtering lives
 * in `useExplorerSearch` so the two concerns stay independent.
 *
 * Returns the unfiltered tree so heavy consumers (e.g. a virtualised
 * list) can swap in their own filtering strategy without losing
 * shared state.
 */
export function useExplorer(
  documentation: Documentation = DEFAULT_DOCUMENTATION,
  options: UseExplorerOptions = {},
): ExplorerState & {
  readonly tree: ExplorerTree;
  readonly documentation: Documentation;
} {
  const sections = useToggle<ExplorerSectionId>(
    options.initialSections ?? [
      EXPLORER_SECTION.API,
      EXPLORER_SECTION.Components,
      EXPLORER_SECTION.Tags,
      EXPLORER_SECTION.Servers,
    ],
  );
  const folders = useToggle<string>(options.initialFolders ?? []);

  const [query, setQuery] = React.useState<string>(options.initialQuery ?? "");
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    undefined,
  );

  const tree = React.useMemo<ExplorerTree>(
    () => buildExplorerTree(documentation),
    [documentation],
  );

  return React.useMemo(
    () => ({
      documentation,
      tree,
      query,
      setQuery,
      expandedFolders: folders.value,
      toggleFolder: folders.toggle,
      setExpandedFolders: folders.set,
      expandedSections: sections.value,
      toggleSection: sections.toggle,
      setExpandedSections: sections.set,
      selectedId,
      setSelectedId,
    }),
    [
      documentation,
      tree,
      query,
      folders.value,
      folders.toggle,
      folders.set,
      sections.value,
      sections.toggle,
      sections.set,
      selectedId,
    ],
  );
}
