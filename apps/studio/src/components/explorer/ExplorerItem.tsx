import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { ExplorerContextMenuTrigger } from "./ExplorerContextMenu";
import { ExplorerLeafIcon } from "./ExplorerIcons";
import type {
  ExplorerLeaf,
  ExplorerServerLeaf,
  ExplorerTagLeaf,
  ExplorerSchemaLeaf,
  ExplorerPlaceholderLeaf,
} from "./Explorer.types";

/**
 * Leaf row — used for schemas, tags, servers, response/parameter/
 * request-body placeholders. Renders a small leading icon, a label
 * (truncated) and an optional description on a second line.
 */
export function ExplorerItem({
  leaf,
  onSelect,
}: {
  leaf: ExplorerLeaf;
  onSelect?: (leaf: ExplorerLeaf) => void;
}): React.ReactElement {
  const handle = () => onSelect?.(leaf);

  const meta = describeLeaf(leaf);

  return (
    <button
      type="button"
      onClick={handle}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-sm px-5 py-1 text-left",
        "text-xs text-text-secondary hover:bg-bg-muted hover:text-text-primary",
        "focus:outline-none focus-visible:bg-bg-muted",
      )}
    >
      <ExplorerLeafIcon
        kind={meta.iconKind}
        className="h-3 w-3 shrink-0 text-text-muted"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{meta.name}</span>
        {meta.secondary ? (
          <span className="truncate text-[10px] text-text-muted">
            {meta.secondary}
          </span>
        ) : null}
      </span>
      {meta.tag ? (
        <Badge tone="subtle" size="xs" className="shrink-0">
          {meta.tag}
        </Badge>
      ) : null}
      <ExplorerContextMenuTrigger ariaLabel={`Actions for ${meta.name}`} />
    </button>
  );
}

interface LeafMeta {
  readonly iconKind:
    | "schema"
    | "tag"
    | "server"
    | "response"
    | "parameter"
    | "requestBody"
    | "placeholder";
  readonly name: string;
  readonly secondary?: string;
  readonly tag?: string;
}

function describeLeaf(leaf: ExplorerLeaf): LeafMeta {
  switch (leaf.kind) {
    case "schema": {
      const l = leaf as ExplorerSchemaLeaf;
      const propCount = Object.keys(l.schema.properties).length;
      return {
        iconKind: "schema",
        name: l.name,
        secondary: `${propCount} ${propCount === 1 ? "field" : "fields"}`,
        tag: l.description ? "" : "Schema",
      };
    }
    case "tag": {
      const l = leaf as ExplorerTagLeaf;
      return {
        iconKind: "tag",
        name: l.name,
        secondary: l.description,
      };
    }
    case "server": {
      const l = leaf as ExplorerServerLeaf;
      return {
        iconKind: "server",
        name: l.name,
        secondary: l.url,
      };
    }
    case "placeholder": {
      const l = leaf as ExplorerPlaceholderLeaf;
      return {
        iconKind: "placeholder",
        name: l.name,
      };
    }
  }
}
