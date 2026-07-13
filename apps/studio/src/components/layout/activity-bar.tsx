"use client";

import {
  Box,
  Code2,
  FolderTree,
  History,
  Layers,
  Server,
  Settings,
  Star,
  Tag,
} from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import {
  ExplorerSection,
  type ExplorerSectionId,
} from "@/constants/explorer";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

interface ActivityItem {
  readonly id: ExplorerSectionId;
  readonly label: string;
  readonly icon: typeof Box;
}

/**
 * Slim vertical bar on the very left of the workspace that switches the
 * explorer section. Mirrors the VS Code activity bar.
 */
const ITEMS: readonly ActivityItem[] = [
  { id: ExplorerSection.Endpoints, label: "Endpoints", icon: FolderTree },
  { id: ExplorerSection.Schemas, label: "Schemas", icon: Box },
  { id: ExplorerSection.Components, label: "Components", icon: Layers },
  { id: ExplorerSection.Tags, label: "Tags", icon: Tag },
  { id: ExplorerSection.Servers, label: "Servers", icon: Server },
  { id: ExplorerSection.Favorites, label: "Favorites", icon: Star },
  { id: ExplorerSection.Recent, label: "Recent", icon: History },
];

export function ActivityBar() {
  const section = useUiStore((state) => state.explorerSection);
  const setSection = useUiStore((state) => state.setExplorerSection);

  return (
    <aside
      aria-label="Explorer sections"
      className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border bg-bg-subtle py-2"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = section === item.id;
        return (
          <Tooltip key={item.id} content={item.label} side="right">
            <button
              type="button"
              aria-label={item.label}
              aria-pressed={active}
              onClick={() => setSection(item.id)}
              className={cn(
                "group flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-bg-muted text-accent"
                  : "text-text-muted hover:bg-bg-muted hover:text-text-primary",
              )}
            >
              <Icon className="size-4" aria-hidden />
              <span
                aria-hidden
                className={cn(
                  "absolute ml-7 h-5 w-0.5 rounded-full bg-accent transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
            </button>
          </Tooltip>
        );
      })}

      <div className="mt-auto flex flex-col items-center gap-1">
        <Tooltip content="Code" side="right">
          <button
            type="button"
            aria-label="Code"
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            <Code2 className="size-4" aria-hidden />
          </button>
        </Tooltip>
        <Tooltip content="Settings" side="right">
          <button
            type="button"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            <Settings className="size-4" aria-hidden />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
}