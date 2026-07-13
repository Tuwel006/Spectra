"use client";

import { Folder, FolderOpen } from "lucide-react";
import { type ReactNode, useMemo } from "react";

import { useExplorerStore } from "@/store/explorer-store";
import { CollapsibleSection } from "@/components/ui";
import { cn } from "@/lib/cn";
import { TreeRow } from "./tree-row";

export interface TreeNode {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly children?: readonly TreeNode[];
  /** Force the node to render as a leaf even if `children` is non-empty. */
  readonly leaf?: boolean;
}

interface TreeProps {
  readonly rootLabel: string;
  readonly rootId: string;
  readonly nodes: readonly TreeNode[];
  readonly renderRow?: (node: TreeNode, depth: number) => ReactNode;
  readonly className?: string;
}

/**
 * Generic tree used by the explorer sections.
 *
 * Wraps the node list with a single collapsible header. Each node
 * recursively renders its own subtree (max depth is constrained by the
 * data model — operations don't go deeper than 3 levels).
 */
export function Tree({ rootLabel, rootId, nodes, renderRow, className }: TreeProps) {
  const expanded = useExplorerStore((state) => state.expandedNodes[rootId] ?? true);
  const toggleNode = useExplorerStore((state) => state.toggleNode);

  return (
    <CollapsibleSection
      title={rootLabel}
      expanded={expanded}
      onToggle={() => toggleNode(rootId)}
      className={className}
    >
      <Subtree nodes={nodes} depth={0} renderRow={renderRow} />
    </CollapsibleSection>
  );
}

interface SubtreeProps {
  readonly nodes: readonly TreeNode[];
  readonly depth: number;
  readonly renderRow?: (node: TreeNode, depth: number) => ReactNode;
}

function Subtree({ nodes, depth, renderRow }: SubtreeProps) {
  return (
    <div role="group" className="flex flex-col">
      {nodes.map((node) => (
        <TreeItem key={node.id} node={node} depth={depth} renderRow={renderRow} />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  depth,
  renderRow,
}: {
  node: TreeNode;
  depth: number;
  renderRow?: (node: TreeNode, depth: number) => ReactNode;
}) {
  const expanded = useExplorerStore((state) => state.expandedNodes[node.id] ?? depth < 1);
  const toggle = useExplorerStore((state) => state.toggleNode);
  const hasChildren = !node.leaf && (node.children?.length ?? 0) > 0;

  const memoIcon = useMemo(
    () =>
      node.icon ?? (
        <Folder
          className={cn(
            "size-3.5 text-text-muted transition-colors",
            expanded && "text-accent",
          )}
          aria-hidden
        />
      ),
    [node.icon, expanded],
  );

  if (renderRow) {
    return (
      <div className="flex flex-col">
        {renderRow(node, depth)}
        {hasChildren && expanded ? (
          <Subtree nodes={node.children ?? []} depth={depth + 1} renderRow={renderRow} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TreeRow
        id={node.id}
        depth={depth}
        label={node.label}
        icon={
          hasChildren ? (
            expanded ? (
              <FolderOpen className="size-3.5 text-accent" aria-hidden />
            ) : (
              memoIcon
            )
          ) : (
            node.icon ?? <span className="size-3.5" aria-hidden />
          )
        }
        expandable={hasChildren}
        expanded={expanded}
        onToggle={() => toggle(node.id)}
        hoverable
      />
      {hasChildren && expanded ? (
        <Subtree nodes={node.children ?? []} depth={depth + 1} renderRow={renderRow} />
      ) : null}
    </div>
  );
}