"use client";

import { Command } from "cmdk";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Compass,
  FileCode2,
  Globe,
  Hash,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";

import { useUiStore } from "@/store/ui-store";
import { useTabsStore } from "@/store/tabs-store";
import { useExplorerStore } from "@/store/explorer-store";
import { useLayoutStore } from "@/store/layout-store";
import { ExplorerSection, type ExplorerSectionId } from "@/constants/explorer";
import { flattenOperations, operationKey } from "@/lib/tree";
import { mockDocumentation } from "@/mock/documentation";
import { readTags } from "@/types/extension";
import { cn } from "@/lib/cn";

/**
 * Global command palette (cmdk).
 *
 * Categories of commands:
 *  - Navigation: switch explorer section, toggle sidebars.
 *  - Endpoints: jump to any operation in the documentation.
 *  - Themes: light / dark / system.
 *  - Help: list keyboard shortcuts.
 *
 * Open via Ctrl/Cmd+K. Closes on Escape or backdrop click.
 */
export function CommandPalette() {
  const open = useUiStore((state) => state.paletteOpen);
  const close = useUiStore((state) => state.closePalette);
  const setSection = useUiStore((state) => state.setExplorerSection);
  const toggleLeft = useLayoutStore((state) => state.toggleLeftSidebar);
  const toggleRight = useLayoutStore((state) => state.toggleRightSidebar);
  const openTab = useTabsStore((state) => state.openTab);
  const pushRecent = useExplorerStore((state) => state.pushRecent);

  // Reset the input when reopened.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  const allOps = useMemo(
    () => flattenOperations(mockDocumentation.paths),
    [],
  );

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Command label="Spectra command palette" className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 text-text-muted" aria-hidden />
            <Command.Input
              autoFocus
              placeholder="Type a command, search an endpoint, jump to a section…"
              className="h-12 w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto p-1">
            <Command.Empty className="px-4 py-6 text-center text-sm text-text-muted">
              No matches.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-1 pb-1">
              {NAVIGATION_COMMANDS.map((command) => (
                <PaletteItem
                  key={command.id}
                  icon={<Compass className="size-4" aria-hidden />}
                  label={command.label}
                  description={command.description}
                  onSelect={() => {
                    command.run({ setSection, toggleLeft, toggleRight });
                    close();
                  }}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Endpoints" className="px-1 pb-1">
              {allOps.map((op) => {
                const key = operationKey(op.pathId, op.method);
                const tags = readTags(op.extensions);
                return (
                  <PaletteItem
                    key={key}
                    icon={
                      <FileCode2 className="size-4 text-text-muted" aria-hidden />
                    }
                    label={
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
                          {op.method}
                        </span>
                        <span className="font-mono text-xs">{op.pathUrl}</span>
                      </span>
                    }
                    description={op.summary ?? tags.join(" · ")}
                    onSelect={() => {
                      openTab({
                        pathId: op.pathId,
                        method: op.method,
                        url: op.pathUrl,
                        title: op.name ?? op.pathUrl,
                      });
                      pushRecent(key);
                      close();
                    }}
                  />
                );
              })}
            </Command.Group>

            <Command.Group heading="Schemas" className="px-1 pb-1">
              {Object.keys(mockDocumentation.components.schemas)
                .slice(0, 30)
                .map((id) => (
                  <PaletteItem
                    key={id}
                    icon={<Layers className="size-4 text-text-muted" aria-hidden />}
                    label={<span className="font-mono text-xs">{id}</span>}
                    description="Schema"
                    onSelect={close}
                  />
                ))}
            </Command.Group>

            <Command.Group heading="Servers" className="px-1 pb-1">
              {mockDocumentation.servers.map((server) => (
                <PaletteItem
                  key={server.id}
                  icon={<Globe className="size-4 text-text-muted" aria-hidden />}
                  label={server.name ?? server.url}
                  description={server.url}
                  onSelect={close}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Tags" className="px-1 pb-1">
              {mockDocumentation.tags.map((tag) => (
                <PaletteItem
                  key={tag.id}
                  icon={<Hash className="size-4 text-text-muted" aria-hidden />}
                  label={tag.name}
                  description={tag.description}
                  onSelect={close}
                />
              ))}
            </Command.Group>
          </Command.List>

          <footer className="flex items-center justify-between border-t border-border bg-bg-subtle px-3 py-2 text-[11px] text-text-muted">
            <span className="flex items-center gap-2">
              <Sparkles className="size-3 text-accent" aria-hidden />
              Tip: <span className="font-mono">↑↓</span> to navigate,{" "}
              <span className="font-mono">Enter</span> to select,{" "}
              <span className="font-mono">Esc</span> to close
            </span>
            <span className="font-mono">Spectra Studio</span>
          </footer>
        </Command>
      </div>
    </div>
  );
}

interface PaletteItemProps {
  readonly icon: React.ReactNode;
  readonly label: React.ReactNode;
  readonly description?: string;
  readonly onSelect: () => void;
}

function PaletteItem({ icon, label, description, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      value={`${flattenText(label)} ${description ?? ""}`}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm aria-selected:bg-accent-subtle aria-selected:text-accent"
    >
      {icon}
      <span className="flex-1 truncate text-text-primary">{label}</span>
      {description ? (
        <span className="hidden truncate text-xs text-text-muted sm:inline">
          {description}
        </span>
      ) : null}
      <ArrowRight
        className="size-3 text-text-muted opacity-0 transition-opacity aria-selected:opacity-100"
        aria-hidden
      />
    </Command.Item>
  );
}

function flattenText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join(" ");
  if (node && typeof node === "object" && "props" in node) {
    return flattenText((node as { props: { children: React.ReactNode } }).props.children);
  }
  return "";
}

interface NavCommand {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly run: (api: {
    setSection: (section: ExplorerSectionId) => void;
    toggleLeft: () => void;
    toggleRight: () => void;
  }) => void;
}

const NAVIGATION_COMMANDS: readonly NavCommand[] = [
  {
    id: "nav-endpoints",
    label: "Show Endpoints",
    description: "Switch the explorer to endpoints",
    run: ({ setSection }) => setSection(ExplorerSection.Endpoints),
  },
  {
    id: "nav-schemas",
    label: "Show Schemas",
    description: "Switch the explorer to schemas",
    run: ({ setSection }) => setSection(ExplorerSection.Schemas),
  },
  {
    id: "nav-tags",
    label: "Show Tags",
    description: "Switch the explorer to tags",
    run: ({ setSection }) => setSection(ExplorerSection.Tags),
  },
  {
    id: "nav-servers",
    label: "Show Servers",
    description: "Switch the explorer to servers",
    run: ({ setSection }) => setSection(ExplorerSection.Servers),
  },
  {
    id: "nav-favorites",
    label: "Show Favorites",
    description: "Switch the explorer to favorites",
    run: ({ setSection }) => setSection(ExplorerSection.Favorites),
  },
  {
    id: "nav-recents",
    label: "Show Recents",
    description: "Switch the explorer to recents",
    run: ({ setSection }) => setSection(ExplorerSection.Recents),
  },
  {
    id: "nav-toggle-left",
    label: "Toggle Left Sidebar",
    description: "Show or hide the explorer",
    run: ({ toggleLeft }) => toggleLeft(),
  },
  {
    id: "nav-toggle-right",
    label: "Toggle Right Sidebar",
    description: "Show or hide the AI panel",
    run: ({ toggleRight }) => toggleRight(),
  },
];