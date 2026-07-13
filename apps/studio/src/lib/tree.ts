import type { Identifier, NamedCollection, Operation, Path } from "@spectra/core";

/**
 * Walk every operation across every path in a flat list.
 *
 * The result preserves the original `path.id` so the UI can keep an
 * unambiguous reference to the parent path.
 */
export interface FlatOperation extends Operation {
  readonly pathId: Identifier;
  readonly pathUrl: string;
}

export function flattenOperations(paths: NamedCollection<Path>): FlatOperation[] {
  const out: FlatOperation[] = [];
  for (const path of Object.values(paths)) {
    for (const operation of Object.values(path.operations)) {
      if (!operation) continue;
      out.push({
        ...operation,
        pathId: path.id,
        pathUrl: path.url,
      });
    }
  }
  return out;
}

/**
 * Build a `pathId:method` identifier for an operation. Used as the stable
 * key for tabs, favorites and recent history entries.
 */
export function operationKey(pathId: Identifier, method: string): string {
  return `${pathId}:${method.toUpperCase()}`;
}