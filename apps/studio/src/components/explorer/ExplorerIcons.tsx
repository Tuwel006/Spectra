import * as React from "react";
import {
  Box,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Cloud,
  Cog,
  Component,
  FileCode,
  Folder,
  FolderOpen,
  History,
  Layers,
  ListTree,
  Package,
  Route as RouteIcon,
  Search as SearchIcon,
  Sparkles,
  Star,
  Tag as TagIcon,
  X,
} from "lucide-react";

import type { HttpMethod } from "@spectra/core";

import { methodLabel } from "@/lib/http";

/**
 * Lucide icons shared across the explorer tree. Centralised so a tree
 * refactor only touches one file. Each component is `React.memo`'d to
 * avoid re-rendering during tree state changes.
 */

export const ExplorerFolderIcon = React.memo(function ExplorerFolderIcon({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className={className} aria-hidden="true" />;
});

export const ExplorerChevronIcon = React.memo(function ExplorerChevronIcon({
  open,
  className,
}: {
  open: boolean;
  className?: string;
}) {
  const Icon = open ? ChevronDown : ChevronRight;
  return (
    <Icon
      className={className}
      aria-hidden="true"
    />
  );
});

/** Icon for non-endpoint leaves (schema, tag, server, …). */
export const ExplorerLeafIcon = React.memo(function ExplorerLeafIcon({
  kind,
  className,
}: {
  kind:
    | "schema"
    | "tag"
    | "server"
    | "response"
    | "parameter"
    | "requestBody"
    | "favorites"
    | "recent"
    | "settings"
    | "components"
    | "placeholder";
  className?: string;
}) {
  const map = {
    schema: Package,
    tag: TagIcon,
    server: Cloud,
    response: FileCode,
    parameter: CircleDot,
    requestBody: FileCode,
    favorites: Star,
    recent: History,
    settings: Cog,
    components: Component,
    placeholder: Box,
  } as const;
  const Icon = map[kind];
  return <Icon className={className} aria-hidden="true" />;
});

/** Small coloured dot used to communicate the HTTP method at a glance. */
export const ExplorerMethodDot = React.memo(function ExplorerMethodDot({
  method,
  className,
}: {
  method: HttpMethod;
  className?: string;
}) {
  // Tokens live in `globals.css` as `--color-method-*`.
  const token = `var(--color-method-${method.toLowerCase()}, currentColor)`;
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        backgroundColor: token,
      }}
    />
  );
});

export const ExplorerRouteIcon = React.memo(function ExplorerRouteIcon({
  className,
}: {
  className?: string;
}) {
  return <RouteIcon className={className} aria-hidden="true" />;
});

export const ExplorerSearchIcon = React.memo(function ExplorerSearchIcon({
  className,
}: {
  className?: string;
}) {
  return <SearchIcon className={className} aria-hidden="true" />;
});

export const ExplorerClearIcon = React.memo(function ExplorerClearIcon({
  className,
}: {
  className?: string;
}) {
  return <X className={className} aria-hidden="true" />;
});

export const ExplorerLayersIcon = React.memo(function ExplorerLayersIcon({
  className,
}: {
  className?: string;
}) {
  return <Layers className={className} aria-hidden="true" />;
});

export const ExplorerListIcon = React.memo(function ExplorerListIcon({
  className,
}: {
  className?: string;
}) {
  return <ListTree className={className} aria-hidden="true" />;
});

export const ExplorerSparklesIcon = React.memo(function ExplorerSparklesIcon({
  className,
}: {
  className?: string;
}) {
  return <Sparkles className={className} aria-hidden="true" />;
});

/** Trivial re-export so consumers can use the same label utility. */
export { methodLabel };
