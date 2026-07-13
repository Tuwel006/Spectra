"use client";

import * as React from "react";

import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { TabActions } from "./TabActions";
import { TabCloseButton } from "./TabCloseButton";
import { TabContextMenu, type TabContextMenuItem } from "./TabContextMenu";
import type { EndpointTabItem } from "../workspace.types";

/**
 * Single browser-style tab. Visually anchored to a slot above the
 * workspace body; the active tab "floats" by inverting the chrome with
 * the surrounding content colour.
 *
 * Interactions:
 *   • Click                → activate
 *   • Middle-click / ×     → close
 *   • Right-click          → handled by parent (`onContextMenu`)
 *   • Drag (placeholder)   → reorder, hooked in Phase 5
 */
export function EndpointTab({
  tab,
  active,
  onActivate,
  onClose,
  onCloseOthers,
  onDuplicate,
  onTogglePin,
}: {
  tab: EndpointTabItem;
  active: boolean;
  onActivate: (tab: EndpointTabItem) => void;
  onClose: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string) => void;
}): React.ReactElement {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const items: TabContextMenuItem[] = React.useMemo(
    () => [
      {
        id: "duplicate",
        label: "Duplicate",
        onSelect: () => onDuplicate(tab.id),
      },
      {
        id: "pin",
        label: tab.pinned ? "Unpin tab" : "Pin tab",
        onSelect: () => onTogglePin(tab.id),
      },
      { id: "sep", label: "", onSelect: () => undefined, disabled: true },
      {
        id: "close",
        label: "Close",
        onSelect: () => onClose(tab.id),
      },
      {
        id: "close-others",
        label: "Close other tabs",
        onSelect: () => onCloseOthers(tab.id),
      },
    ],
    [tab, onClose, onCloseOthers, onDuplicate, onTogglePin],
  );

  return (
    <div
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={active}
      aria-controls={`tabpanel-${tab.id}`}
      tabIndex={active ? 0 : -1}
      onClick={() => onActivate(tab)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate(tab);
        }
      }}
      onAuxClick={(event) => {
        if (event.button === 1) {
          event.preventDefault();
          onClose(tab.id);
        }
      }}
      data-active={active || undefined}
      data-pinned={tab.pinned || undefined}
      className={cn(
        "group/tab relative flex h-8 max-w-[200px] min-w-[120px] flex-1 cursor-pointer items-center gap-1.5 border-r border-border px-2.5 text-left",
        "transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        active
          ? "bg-bg-base text-text-primary"
          : "bg-bg-muted text-text-secondary hover:bg-bg-subtle",
      )}
    >
      <MethodBadge
        method={tab.method as Parameters<typeof MethodBadge>[0]["method"]}
        size="xs"
        className="shrink-0"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span
          className={cn(
            "truncate font-mono text-[11px]",
            active ? "text-text-primary" : "text-text-secondary",
          )}
        >
          {tab.title}
        </span>
      </span>
      {tab.dirty ? (
        <span
          aria-label="Unsaved changes"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
        />
      ) : null}
      <div className="flex shrink-0 items-center gap-0.5">
        <TabActions
          ariaLabel={`Actions for ${tab.title}`}
          onOpenMenu={() => setMenuOpen((v) => !v)}
        />
        <TabCloseButton
          ariaLabel={`Close ${tab.title}`}
          onClick={() => onClose(tab.id)}
        />
      </div>

      {menuOpen ? (
        <TabContextMenu
          open={menuOpen}
          items={items}
          onDismiss={() => setMenuOpen(false)}
        />
      ) : null}
    </div>
  );
}
