import { useMemo } from "react";
import type { Documentation, Path, HttpMethod } from "@spectra/core";
import type { EndpointEntry, ExplorerNode } from "@/types";
import { mockDocumentation } from "@/mock/documentation";

/**
 * Derives a flat EndpointEntry from a Path + method.
 */
export function makeEndpointEntry(path: Path, method: HttpMethod): EndpointEntry {
  const operation = path.operations[method]!;
  return {
    pathId: path.id,
    url: path.url,
    method,
    operation,
  };
}

/**
 * Groups paths by their "x-tags" extension (first tag wins).
 * Falls back to "Other" if no tags are present.
 */
function groupPathsByTag(
  paths: Record<string, Path>
): Map<string, Path[]> {
  const groups = new Map<string, Path[]>();

  for (const path of Object.values(paths)) {
    const ops = Object.values(path.operations);
    if (ops.length === 0) continue;

    // Derive tag from the first operation's x-tags extension
    const firstOp = ops[0];
    const tags = (firstOp?.extensions?.["x-tags"] as string[] | undefined) ?? [];
    const tag = tags[0] ?? "Other";

    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)!.push(path);
  }

  return groups;
}

/**
 * Builds the explorer tree from the mock documentation.
 * Structure:
 *   [group: tag]
 *     [path node]
 *       [operation node]  (if path has >1 method)
 */
export function useExplorerTree(doc: Documentation = mockDocumentation): ExplorerNode[] {
  return useMemo(() => {
    const paths = doc.paths as Record<string, Path>;
    const grouped = groupPathsByTag(paths);
    const nodes: ExplorerNode[] = [];

    // Sort tag groups alphabetically
    const sortedTags = Array.from(grouped.keys()).sort();

    for (const tag of sortedTags) {
      const tagPaths = grouped.get(tag)!;
      const methods = Object.keys(tagPaths[0]?.operations ?? {}) as HttpMethod[];

      // Endpoint count for the group badge
      const opCount = tagPaths.reduce(
        (sum, p) => sum + Object.keys(p.operations).length,
        0
      );

      const groupChildren: ExplorerNode[] = tagPaths
        .sort((a, b) => a.url.localeCompare(b.url))
        .map((path): ExplorerNode => {
          const opMethods = Object.keys(path.operations) as HttpMethod[];
          const firstMethod = opMethods[0];

          // If a path has a single operation, make the path node clickable directly
          if (opMethods.length === 1 && firstMethod) {
            return {
              id: `${path.id}::${firstMethod}`,
              label: path.url,
              kind: "operation",
              endpoint: makeEndpointEntry(path, firstMethod),
            };
          }

          // Multiple operations → nested children
          return {
            id: path.id,
            label: path.url,
            kind: "path",
            children: opMethods.map((method): ExplorerNode => ({
              id: `${path.id}::${method}`,
              label: `${method} ${path.url}`,
              kind: "operation",
              endpoint: makeEndpointEntry(path, method),
            })),
          };
        });

      nodes.push({
        id: `group-${tag}`,
        label: tag,
        kind: "group",
        count: opCount,
        children: groupChildren,
      });
    }

    // Schemas section
    const schemaNames = Object.keys(doc.components.schemas);
    if (schemaNames.length > 0) {
      nodes.push({
        id: "group-schemas",
        label: "Schemas",
        kind: "group",
        count: schemaNames.length,
        children: schemaNames.sort().map((name): ExplorerNode => ({
          id: `schema-${name}`,
          label: name,
          kind: "schema",
        })),
      });
    }

    return nodes;
  }, [doc]);
}
