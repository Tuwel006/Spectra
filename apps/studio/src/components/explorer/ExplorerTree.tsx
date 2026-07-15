import * as React from "react";
import { History, Layers, Pin } from "lucide-react";

import { useWorkspaceStore } from "@/components/workspace";
import { cn } from "@/lib/cn";

import { ExplorerEmpty } from "./ExplorerEmpty";
import { ExplorerNode } from "./ExplorerNode";
import { ExplorerSection } from "./ExplorerSection";
import { PinnedList, RecentList } from "./ExplorerStaticRows";
import { EXPLORER_SECTION } from "./types/ExplorerNode";
import type { ExplorerState } from "./types/ExplorerState";
import type {
  ExplorerEndpoint,
  ExplorerTree as ExplorerTreeType,
} from "./types/ExplorerNode";

/**
 * Orchestrator for the visible explorer sections. Stateless — toggle /
 * filter state lives in `useExplorer`.
 *
 * Sections, in display order:
 *   1. APIs             — tag folders (Authentication, Users, …) + endpoints
 *   2. Pinned           — {@link PinnedList}
 *   3. Recently Opened  — {@link RecentList}
 *
 * Components / Tags / Servers / Settings were intentionally removed to
 * match the Postman-style reference; the data is still available on
 * the underlying tree if a future surface wants to surface it.
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
  // Subscribe to the workspace store so the Pinned / Recent counts and
  // contents update live whenever tabs are opened, closed, or pinned.
  const pinnedCount = useWorkspaceStore(
    (s) => s.tabs.filter((t) => t.pinned).length,
  );
  const recentCount = useWorkspaceStore((s) => s.tabs.length);

  const isFiltering = state.query.trim().length > 0;
  const totallyEmpty = tree.api.length === 0;

  if (totallyEmpty) {
    return <ExplorerEmpty query={isFiltering ? state.query : undefined} />;
  }

  return (
    <div
      className="flex flex-col divide-y divide-border overflow-y-auto"
      role="tree"
      aria-label="API explorer"
    >
      <Section
        id={EXPLORER_SECTION.API}
        title="APIs"
        icon={<Layers className="h-3 w-3" />}
        count={tree.endpointCount}
        open={state.expandedSections.has(EXPLORER_SECTION.API)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.API)}
      >
        {renderApi(tree, state, onActivateEndpoint)}
      </Section>

      <Section
        id={EXPLORER_SECTION.Favorites}
        title="Pinned"
        icon={<Pin className="h-3 w-3" />}
        count={pinnedCount}
        open={state.expandedSections.has(EXPLORER_SECTION.Favorites)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Favorites)}
      >
        <PinnedList />
      </Section>

      <Section
        id={EXPLORER_SECTION.Recent}
        title="Recently Opened"
        icon={<History className="h-3 w-3" />}
        count={recentCount}
        open={state.expandedSections.has(EXPLORER_SECTION.Recent)}
        onToggle={() => state.toggleSection(EXPLORER_SECTION.Recent)}
      >
        <RecentList />
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
  id: string;
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
    return (
      <p
        className={cn(
          "px-5 py-3 text-[11px] italic leading-relaxed text-text-muted",
        )}
      >
        No endpoints match your search.
      </p>
    );
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