"use client";

import * as React from "react";
import { ChevronRight, FolderOpen, Folder, Box, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { MethodBadge } from "@/components/ui/MethodBadge";
import { useExplorerStore } from "@/store/explorer.store";
import { useTabStore } from "@/store/tab.store";
import type { ExplorerNode } from "@/types";
import type { HttpMethod } from "@spectra/core";

interface ExplorerNodeItemProps {
  node: ExplorerNode;
  depth?: number;
}

const GROUP_ICONS: Record<string, React.ElementType> = {
  "group-schemas": Box,
  "group-servers": Server,
};

/**
 * Recursive tree node renderer for the API Explorer.
 * Handles groups, paths (collapsible), and operations (leaf nodes).
 */
export function ExplorerNodeItem({ node, depth = 0 }: ExplorerNodeItemProps) {
  const { expansion, toggleNode, setSelectedNode, selectedNodeId } = useExplorerStore();
  const { openTab } = useTabStore();

  const isExpanded = !!expansion[node.id];
  const isSelected = selectedNodeId === node.id;
  const hasChildren = node.children && node.children.length > 0;

  const indent = depth * 12;

  const handleClick = () => {
    if (node.kind === "operation" && node.endpoint) {
      setSelectedNode(node.id);
      openTab(node.endpoint);
    } else if (hasChildren) {
      toggleNode(node.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
    if (e.key === "ArrowRight" && hasChildren && !isExpanded) toggleNode(node.id);
    if (e.key === "ArrowLeft" && hasChildren && isExpanded) toggleNode(node.id);
  };

  // Render a group (tag section)
  if (node.kind === "group") {
    const Icon = GROUP_ICONS[node.id] ?? (isExpanded ? FolderOpen : Folder);
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-7 cursor-pointer select-none items-center gap-2 px-2 rounded-md",
            "text-xs font-semibold uppercase tracking-wider text-[--color-text-muted]",
            "hover:bg-[--color-bg-muted] hover:text-[--color-text-primary] transition-colors",
            "mt-1"
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[--color-text-disabled] transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{node.label}</span>
          {node.count !== undefined && (
            <span className="text-[10px] text-[--color-text-disabled] font-normal tabular-nums">
              {node.count}
            </span>
          )}
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && hasChildren && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {node.children!.map((child) => (
                <ExplorerNodeItem key={child.id} node={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render a path node (expandable, multiple methods)
  if (node.kind === "path") {
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-7 cursor-pointer select-none items-center gap-1.5 rounded-md px-2",
            "text-xs text-[--color-text-secondary] hover:bg-[--color-bg-muted]",
            "hover:text-[--color-text-primary] transition-colors"
          )}
          style={{ paddingLeft: `${indent + 8}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-[--color-text-disabled] transition-transform duration-150",
              isExpanded && "rotate-90"
            )}
          />
          <span className="flex-1 truncate font-mono text-[11px]">{node.label}</span>
        </div>
        <AnimatePresence initial={false}>
          {isExpanded && hasChildren && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {node.children!.map((child) => (
                <ExplorerNodeItem key={child.id} node={child} depth={depth + 1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render an operation node (leaf)
  const method = node.endpoint?.method as HttpMethod | undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-7 cursor-pointer select-none items-center gap-2 rounded-md px-2",
        "text-xs transition-colors",
        isSelected
          ? "bg-[--color-accent-subtle] text-[--color-text-primary]"
          : "text-[--color-text-secondary] hover:bg-[--color-bg-muted] hover:text-[--color-text-primary]"
      )}
      style={{ paddingLeft: `${indent + 8}px` }}
      aria-selected={isSelected}
    >
      {method && (
        <MethodBadge method={method} compact className="shrink-0 text-[9px] w-12 justify-center" />
      )}
      <span className="flex-1 truncate font-mono text-[11px]">
        {node.endpoint?.url ?? node.label}
      </span>
    </div>
  );
}
