import * as React from "react";
import {
  Cloud,
  History,
  Layers,
  ListTree,
  Settings,
  Star,
  Tag as TagIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerNode } from "./ExplorerNode";
import { ExplorerSection } from "./ExplorerSection";
import { EXPLORER_SECTION, type ExplorerSectionId } from "./types/ExplorerNode";
import type { ExplorerState } from "./types/ExplorerState";
import type {
  ExplorerComponentGroup,
  ExplorerEndpoint,
  ExplorerLeaf,
  ExplorerTagFolder,
  ExplorerTree as ExplorerTreeType,
} from "./types/ExplorerNode";

/**
 * Orchestrator for every section in the explorer. Stateless — the
 * parent owns the toggle / filter state via `useExplorer` /
 * `useExplorerSearch`.
 *
 * Sections are rendered in the order from the spec layout:
 *   API → Components → Tags → Servers → Favorites → Recent → Settings
 */
export function ExplorerTree({
  tree,
  state,
  onActivateEndpoint,
}: {
  tree: ExplorerTreeType;
  state: ExplorerState;
  onActivateEndpoint?: (endpoint: ExplorerEndpoint) => void;
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

  return (
    <div
      className="flex flex-col overflow-y-auto"
      role="tree"
      aria-label="API explorer"
    >
      <Section
        id={EXPLORER_SECTION.API}
        title="API"
        icon={<Layers className="h-3 w-3" />}
        count={tree.endpointCount}
        open={state.expandedSections.has(EXPLORER_SECTION.API)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.API)}
      >
        {renderApi(tree, state, onActivateEndpoint)}
      </Section>

      <Section
        id={EXPLORER_SECTION.Components}
        title="Components"
        icon={<ListTree className="h-3 w-3" />}
        count={tree.components.reduce((n, g) => n + g.entries.length, 0)}
        open={state.expandedSections.has(EXPLORER_SECTION.Components)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Components)}
      >
        {renderComponents(tree, state)}
      </Section>

      <Section
        id={EXPLORER_SECTION.Tags}
        title="Tags"
        icon={<TagIcon className="h-3 w-3" />}
        count={tree.tags.length}
        open={state.expandedSections.has(EXPLORER_SECTION.Tags)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Tags)}
      >
        <LeafGroup leaves={tree.tags} emptyHint="No tags yet." />
      </Section>

      <Section
        id={EXPLORER_SECTION.Servers}
        title="Servers"
        icon={<Cloud className="h-3 w-3" />}
        count={tree.servers.length}
        open={state.expandedSections.has(EXPLORER_SECTION.Servers)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Servers)}
      >
        <LeafGroup
          leaves={tree.servers as readonly ExplorerLeaf[]}
          emptyHint="No servers configured."
        />
      </Section>

      <Section
        id={EXPLORER_SECTION.Favorites}
        title="Favorites"
        icon={<Star className="h-3 w-3" />}
        count={0}
        open={state.expandedSections.has(EXPLORER_SECTION.Favorites)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Favorites)}
      >
        <EmptySection message="Star endpoints to see them here." />
      </Section>

      <Section
        id={EXPLORER_SECTION.Recent}
        title="Recent"
        icon={<History className="h-3 w-3" />}
        count={0}
        open={state.expandedSections.has(EXPLORER_SECTION.Recent)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Recent)}
      >
        <EmptySection message="Recently opened endpoints will appear here." />
      </Section>

      <Section
        id={EXPLORER_SECTION.Settings}
        title="Settings"
        icon={<Settings className="h-3 w-3" />}
        count={0}
        open={state.expandedSections.has(EXPLORER_SECTION.Settings)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Settings)}
      >
        <EmptySection message="Explorer preferences will land here." />
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section wrapper                                                     */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  icon,
  count,
  open,
  onToggle,
  children,
}: {
  id: ExplorerSectionId;
  title: string;
  icon: React.ReactNode;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <ExplorerSection
      id={id}
      title={title}
      count={count}
      open={open}
      onToggle={onToggle}
      defaultIcon={icon}
    >
      {children}
    </ExplorerSection>
  );
}

/* ------------------------------------------------------------------ */
/* API section                                                         */
/* ------------------------------------------------------------------ */

function renderApi(
  tree: ExplorerTreeType,
  state: ExplorerState,
  onActivate: ((ep: ExplorerEndpoint) => void) | undefined,
): React.ReactNode {
  if (tree.api.length === 0) {
    return <EmptySection message="No endpoints match your search." />;
  }
  return (
    <div role="group" className="flex flex-col">
      {tree.api.map((folder) => {
        const folderOpen = state.expandedFolders.has(folder.id);
        return (
          <div key={folder.id} className="flex flex-col">
            <ExplorerNode
              kind="folder"
              id={folder.id}
              name={folder.name}
              count={folder.endpoints.length}
              depth={1}
              open={folderOpen}
              onToggle={() => state.toggleFolder(folder.id)}
            />
            {folderOpen ? (
              <div role="group" className="flex flex-col">
                {folder.endpoints.map((ep) => (
                  <ExplorerNode
                    key={ep.id}
                    kind="endpoint"
                    endpoint={ep}
                    depth={2}
                    selected={state.selectedId === ep.id}
                    onActivate={(e) => onActivate?.(e)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Components section                                                  */
/* ------------------------------------------------------------------ */

function renderComponents(
  tree: ExplorerTreeType,
  state: ExplorerState,
): React.ReactNode {
  if (tree.components.length === 0) {
    return <EmptySection message="No components in this documentation." />;
  }
  return (
    <div role="group" className="flex flex-col">
      {tree.components.map((group) => {
        const folderOpen = state.expandedFolders.has(group.id);
        return (
          <div key={group.id} className="flex flex-col">
            <ExplorerNode
              kind="folder"
              id={group.id}
              name={group.name}
              count={group.entries.length}
              depth={1}
              open={folderOpen}
              onToggle={() => state.toggleFolder(group.id)}
            />
            {folderOpen ? (
              <div role="group" className="flex flex-col">
                {group.entries.map((leaf) => (
                  <ExplorerNode
                    key={leaf.id}
                    kind="leaf"
                    id={leaf.id}
                    name={leaf.name}
                    secondary={describeLeafSecondary(leaf)}
                    iconKind={iconKindForLeaf(leaf)}
                    depth={2}
                  />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generic leaf group (Tags / Servers)                                 */
/* ------------------------------------------------------------------ */

function LeafGroup({
  leaves,
  emptyHint,
}: {
  leaves: readonly ExplorerLeaf[];
  emptyHint: string;
}): React.ReactNode {
  if (leaves.length === 0) {
    return <EmptySection message={emptyHint} />;
  }
  return (
    <div role="group" className="flex flex-col">
      {leaves.map((leaf) => (
        <ExplorerNode
          key={leaf.id}
          kind="leaf"
          id={leaf.id}
          name={leaf.name}
          secondary={describeLeafSecondary(leaf)}
          iconKind={iconKindForLeaf(leaf)}
          depth={1}
        />
      ))}
    </div>
  );
}

function EmptySection({ message }: { message: string }): React.ReactElement {
  return (
    <p
      className={cn(
        "px-5 py-3 text-[11px] italic leading-relaxed text-text-muted",
      )}
    >
      {message}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Leaf helpers                                                        */
/* ------------------------------------------------------------------ */

function describeLeafSecondary(leaf: ExplorerLeaf): string | undefined {
  switch (leaf.kind) {
    case "schema": {
      const propCount = Object.keys(leaf.schema.properties).length;
      return `${propCount} ${propCount === 1 ? "field" : "fields"}`;
    }
    case "tag":
      return leaf.description ?? undefined;
    case "server":
      return leaf.url;
    case "placeholder":
      return undefined;
  }
}

function iconKindForLeaf(
  leaf: ExplorerLeaf,
):
  | "schema"
  | "tag"
  | "server"
  | "response"
  | "parameter"
  | "requestBody"
  | "placeholder" {
  switch (leaf.kind) {
    case "schema":
      return "schema";
    case "tag":
      return "tag";
    case "server":
      return "server";
    case "placeholder":
      return "placeholder";
  }
}
