"use client";

import * as React from "react";
import { useMemo } from "react";

import {
  HttpMethod,
  type Documentation,
  type Operation,
  type Path,
} from "@spectra/core";

import { mockDocumentation } from "@/mock/documentation";
import type {
  ExplorerComponentGroup,
  ExplorerEndpoint,
  ExplorerLeaf,
  ExplorerPathFolder,
  ExplorerSchemaLeaf,
  ExplorerServerLeaf,
  ExplorerState,
  ExplorerTagFolder,
  ExplorerTagLeaf,
  ExplorerTree,
} from "./Explorer.types";

/**
 * Default module-level documentation. `Explorer.tsx` swaps this out for
 * the prop one when provided, so the rest of the tree never touches
 * `@/mock` directly.
 */
export const DEFAULT_DOCUMENTATION: Documentation = mockDocumentation;

/* ------------------------------------------------------------------ */
/* Operations                                                         */
/* ------------------------------------------------------------------ */

const HTTP_METHODS_ORDER: readonly HttpMethod[] = [
  HttpMethod.GET,
  HttpMethod.POST,
  HttpMethod.PUT,
  HttpMethod.PATCH,
  HttpMethod.DELETE,
  HttpMethod.HEAD,
  HttpMethod.OPTIONS,
];

/**
 * Pull the tag list attached to an operation. Stored on `extensions`
 * under the `x-tags` key (OpenAPI convention). Tolerant of missing /
 * non-array values so a malformed dataset doesn't crash the tree.
 */
function readTags(op: Operation): readonly string[] {
  const raw = op.extensions?.["x-tags"];
  if (Array.isArray(raw)) {
    return raw.filter((t): t is string => typeof t === "string");
  }
  return [];
}

/**
 * Flatten a single `Path` into an array of `ExplorerEndpoint`s. Most
 * production APIs expose multiple HTTP methods per URL, so this expands
 * one path into several rows.
 */
function flattenPath(path: Path): ExplorerEndpoint[] {
  const rows: ExplorerEndpoint[] = [];
  for (const method of HTTP_METHODS_ORDER) {
    const op = path.operations[method];
    if (!op) continue;
    rows.push({
      id: op.id,
      pathId: path.id,
      method,
      url: path.url,
      summary: op.summary,
      tags: readTags(op),
      operation: op,
    });
  }
  return rows;
}

/** Stable id for an endpoint when the operation itself is missing one. */
function deriveEndpointId(path: Path, method: HttpMethod): string {
  return `op_${path.id}_${method.toLowerCase()}`;
}

/**
 * Walk every path → every operation and produce a flat list of rows.
 */
export function flattenEndpoints(doc: Documentation): ExplorerEndpoint[] {
  const rows: ExplorerEndpoint[] = [];
  for (const path of Object.values(doc.paths)) {
    for (const method of HTTP_METHODS_ORDER) {
      const op = path.operations[method];
      if (!op) continue;
      rows.push({
        id: op.id ?? deriveEndpointId(path, method),
        pathId: path.id,
        method,
        url: path.url,
        summary: op.summary,
        tags: readTags(op),
        operation: op,
      });
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Grouping                                                           */
/* ------------------------------------------------------------------ */

/**
 * Group endpoints by tag name. Endpoints without a tag fall into an
 * implicit "Untagged" bucket so they still appear in the tree.
 */
export function groupByTag(
  endpoints: readonly ExplorerEndpoint[],
): ExplorerTagFolder[] {
  const buckets = new Map<string, ExplorerEndpoint[]>();

  // Preserve the tag order declared in the documentation so the UI
  // matches the spec ordering rather than the hit order of the tree.
  const order: string[] = [];
  for (const tag of DEFAULT_DOCUMENTATION.tags) order.push(tag.name);

  // Seed buckets for declared tags. Endpoints tagged with names not in
  // the declaration still get a folder.
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

  // Sort endpoints within each bucket: GET first, POST second, others
  // alphabetical. Stable order helps muscle memory.
  const methodOrder = (m: HttpMethod): number =>
    HTTP_METHODS_ORDER.indexOf(m);
  const sortedOrder = [...buckets.entries()]
    .filter(([, eps]) => eps.length > 0)
    .sort(([a], [b]) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

  return sortedOrder.map(([name, eps]) => ({
    kind: "tag-folder" as const,
    id: `tag-folder:${name}`,
    name,
    endpoints: [...eps].sort((a, b) => {
      const byMethod = methodOrder(a.method) - methodOrder(b.method);
      return byMethod !== 0 ? byMethod : a.url.localeCompare(b.url);
    }),
  }));
}

/* ------------------------------------------------------------------ */
/* Components / tags / servers                                        */
/* ------------------------------------------------------------------ */

function buildComponentGroups(doc: Documentation): ExplorerComponentGroup[] {
  const schemas = Object.values(doc.components.schemas);
  const schemaLeaves: ExplorerSchemaLeaf[] = schemas.map((s) => ({
    kind: "schema" as const,
    id: `schema:${s.id}`,
    name: s.name ?? s.id,
    description: s.description,
    schema: s,
  }));

  // The mock documentation only declares schemas in `components.schemas`
  // — the other buckets (responses/parameters/requestBodies) are kept as
  // placeholders so the spec'd layout still shows the four groups.
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
      entries: placeholder("responses", "Responses", Object.keys(doc.components.responses).length),
    },
    {
      kind: "component-group",
      id: "components:parameters",
      name: "Parameters",
      entries: placeholder("parameters", "Parameters", Object.keys(doc.components.parameters).length),
    },
    {
      kind: "component-group",
      id: "components:requestBodies",
      name: "Request Bodies",
      entries: placeholder(
        "requestBodies",
        "request bodies",
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
/* Path-grouping helper (right-click context, breadcrumbs later)      */
/* ------------------------------------------------------------------ */

export function groupPathsByPrefix(
  doc: Documentation,
): ExplorerPathFolder[] {
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
/* Top-level tree builder                                             */
/* ------------------------------------------------------------------ */

export function buildExplorerTree(doc: Documentation): ExplorerTree {
  const endpoints = flattenEndpoints(doc);
  return {
    api: groupByTag(endpoints),
    components: buildComponentGroups(doc),
    tags: buildTagLeaves(doc),
    servers: buildServerLeaves(doc),
    endpointCount: endpoints.length,
    pathCount: Object.keys(doc.paths).length,
  };
}

/* ------------------------------------------------------------------ */
/* Filtering                                                          */
/* ------------------------------------------------------------------ */

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
  const q = query.trim().toLowerCase();
  if (q.length === 0) return tree;

  const matchesEndpoint = (ep: ExplorerEndpoint): boolean => {
    if (ep.url.toLowerCase().includes(q)) return true;
    if (ep.summary?.toLowerCase().includes(q)) return true;
    if (ep.method.toLowerCase().includes(q)) return true;
    return ep.tags.some((t) => t.toLowerCase().includes(q));
  };

  const api: ExplorerTagFolder[] = [];
  for (const folder of tree.api) {
    const kept = folder.endpoints.filter(matchesEndpoint);
    if (kept.length > 0) {
      api.push({
        kind: "tag-folder",
        id: folder.id,
        name: folder.name,
        endpoints: kept,
      });
    }
  }

  const components: ExplorerComponentGroup[] = [];
  for (const group of tree.components) {
    const kept = group.entries.filter((leaf) => {
      if (leaf.kind === "placeholder") return false;
      return leaf.name.toLowerCase().includes(q);
    });
    if (kept.length > 0) {
      components.push({
        kind: "component-group",
        id: group.id,
        name: group.name,
        entries: kept,
      });
    }
  }

  const tags = tree.tags.filter((t) =>
    t.name.toLowerCase().includes(q),
  );
  const servers = tree.servers.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q),
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
/* Hook                                                               */
/* ------------------------------------------------------------------ */

function useToggle(
  initial: readonly string[] = [],
): {
  readonly value: ReadonlySet<string>;
  readonly toggle: (id: string) => void;
  readonly set: (ids: readonly string[]) => void;
} {
  const [set, setSet] = React.useState<ReadonlySet<string>>(
    () => new Set(initial),
  );
  const toggle = React.useCallback((id: string) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const value = React.useCallback(
    (ids: readonly string[]) => setSet(new Set(ids)),
    [],
  );
  return React.useMemo(
    () => ({ value: set, toggle, set: value }),
    [set, toggle, value],
  );
}

/**
 * Source of truth for the explorer's UI state. Pulls data from the
 * documentation, applies the live search filter, and exposes toggle
 * helpers for sections / folders / selection.
 */
export function useExplorerState(
  doc: Documentation,
  options?: {
    readonly initialSections?: readonly string[];
    readonly initialFolders?: readonly string[];
  },
): ExplorerState & { readonly tree: ExplorerTree } {
  const sections = useToggle(options?.initialSections ?? [
    "section:api",
    "section:components",
    "section:tags",
    "section:servers",
  ]);
  const folders = useToggle(options?.initialFolders ?? []);

  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    undefined,
  );

  const rawTree = useMemo(() => buildExplorerTree(doc), [doc]);
  const tree = useMemo(
    () => filterExplorerTree(rawTree, query),
    [rawTree, query],
  );

  return React.useMemo(
    () => ({
      tree,
      query,
      setQuery,
      expandedFolders: folders.value,
      toggleFolder: folders.toggle,
      expandedSections: sections.value,
      toggleSection: sections.toggle,
      selectedId,
      setSelectedId,
    }),
    [
      tree,
      query,
      folders.value,
      folders.toggle,
      sections.value,
      sections.toggle,
      selectedId,
    ],
  );
}
