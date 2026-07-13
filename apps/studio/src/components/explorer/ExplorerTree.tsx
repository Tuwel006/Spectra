import * as React from "react";
import {
  Cloud,
  History,
  Layers,
  ListTree,
  Star,
  Tag as TagIcon,
} from "lucide-react";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerEndpoint } from "./ExplorerEndpoint";
import { ExplorerFolder } from "./ExplorerFolder";
import { ExplorerItem } from "./ExplorerItem";
import { ExplorerSection } from "./ExplorerSection";
import type {
  ExplorerEndpoint as ExplorerEndpointType,
  ExplorerLeaf,
  ExplorerState,
  ExplorerTree as ExplorerTreeType,
} from "./Explorer.types";

/**
 * Orchestrator for every section in the explorer. Stateless — the
 * parent owns the toggle / filter state via `useExplorerState`.
 *
 * Sections are rendered in the order from the spec layout:
 *   API → Components → Tags → Servers → Favorites → Recent
 */
export function ExplorerTree({
  tree,
  state,
  onActivateEndpoint,
}: {
  tree: ExplorerTreeType;
  state: ExplorerState;
  onActivateEndpoint?: (endpoint: ExplorerEndpointType) => void;
}): React.ReactElement {
  const isFiltering = state.query.trim().length > 0;
  const totallyEmpty =
    tree.api.length === 0 &&
    tree.components.length === 0 &&
    tree.tags.length === 0 &&
    tree.servers.length === 0;

  if (totallyEmpty) {
    return <ExplorerEmpty query={isFiltering ? state.query : undefined} />;
  }

  const sections = [
    { id: "section:api", title: "API", icon: <Layers className="h-3 w-3" />, content: tree.api, count: tree.endpointCount },
    { id: "section:components", title: "Components", icon: <ListTree className="h-3 w-3" />, content: tree.components, count: tree.components.reduce((n, g) => n + g.entries.length, 0) },
    { id: "section:tags", title: "Tags", icon: <TagIcon className="h-3 w-3" />, content: tree.tags, count: tree.tags.length, isLeaf: true },
    { id: "section:servers", title: "Servers", icon: <Cloud className="h-3 w-3" />, content: tree.servers, count: tree.servers.length, isLeaf: true },
    { id: "section:favorites", title: "Favorites", icon: <Star className="h-3 w-3" />, count: 0, isLeaf: true, emptyHint: "Star endpoints to see them here." },
    { id: "section:recent", title: "Recent", icon: <History className="h-3 w-3" />, count: 0, isLeaf: true, emptyHint: "Recently opened endpoints will appear here." },
  ] as const;

  return (
    <div className="flex flex-col overflow-y-auto" role="tree" aria-label="API explorer">
      {sections.map((section) => {
        const open = state.expandedSections.has(section.id);
        return (
          <ExplorerSection
            key={section.id}
            id={section.id}
            title={section.title}
            count={section.count}
            open={open}
            onToggle={() => state.toggleSection(section.id)}
            defaultIcon={section.icon}
          >
            {renderSectionContent(section, tree, state, onActivateEndpoint)}
          </ExplorerSection>
        );
      })}
    </div>
  );
}

type SectionConfig = {
  readonly id: string;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly content?: readonly unknown[];
  readonly count: number;
  readonly isLeaf?: boolean;
  readonly emptyHint?: string;
};

function renderSectionContent(
  section: SectionConfig,
  tree: ExplorerTreeType,
  state: ExplorerState,
  onActivate: ((ep: ExplorerEndpointType) => void) | undefined,
): React.ReactNode {
  switch (section.id) {
    case "section:api":
      return renderApi(tree, state, onActivate);
    case "section:components":
      return renderComponents(tree, state);
    case "section:tags":
      return renderLeaves(tree.tags, state, "No tags yet.");
    case "section:servers":
      return renderLeaves(tree.servers as readonly ExplorerLeaf[], state, "No servers configured.");
    case "section:favorites":
    case "section:recent":
      return (
        <p className="px-5 py-3 text-[11px] italic leading-relaxed text-text-muted">
          {section.emptyHint}
        </p>
      );
  }
  return null;
}

function renderApi(
  tree: ExplorerTreeType,
  state: ExplorerState,
  onActivate: ((ep: ExplorerEndpointType) => void) | undefined,
): React.ReactNode {
  if (tree.api.length === 0) {
    return (
      <p className="px-5 py-3 text-[11px] italic leading-relaxed text-text-muted">
        No endpoints match your search.
      </p>
    );
  }
  return tree.api.map((folder) => {
    const folderOpen = state.expandedFolders.has(folder.id);
    return (
      <ExplorerFolder
        key={folder.id}
        id={folder.id}
        name={folder.name}
        count={folder.endpoints.length}
        open={folderOpen}
        onToggle={() => state.toggleFolder(folder.id)}
      >
        {folder.endpoints.map((ep) => (
          <ExplorerEndpoint
            key={ep.id}
            endpoint={ep}
            selected={state.selectedId === ep.id}
            onActivate={onActivate}
          />
        ))}
      </ExplorerFolder>
    );
  });
}

function renderComponents(
  tree: ExplorerTreeType,
  state: ExplorerState,
): React.ReactNode {
  if (tree.components.length === 0) {
    return (
      <p className="px-5 py-3 text-[11px] italic leading-relaxed text-text-muted">
        No components in this documentation.
      </p>
    );
  }
  return tree.components.map((group) => {
    const folderOpen = state.expandedFolders.has(group.id);
    return (
      <ExplorerFolder
        key={group.id}
        id={group.id}
        name={group.name}
        count={group.entries.length}
        open={folderOpen}
        onToggle={() => state.toggleFolder(group.id)}
      >
        {group.entries.map((leaf) => (
          <ExplorerItem key={leaf.id} leaf={leaf} />
        ))}
      </ExplorerFolder>
    );
  });
}

function renderLeaves(
  leaves: readonly ExplorerLeaf[],
  _state: ExplorerState,
  emptyHint: string,
): React.ReactNode {
  if (leaves.length === 0) {
    return (
      <p className="px-5 py-3 text-[11px] italic leading-relaxed text-text-muted">
        {emptyHint}
      </p>
    );
  }
  return (
    <div role="group" className="flex flex-col">
      {leaves.map((leaf) => (
        <ExplorerItem key={leaf.id} leaf={leaf} />
      ))}
    </div>
  );
}
