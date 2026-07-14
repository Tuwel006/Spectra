"use client";

import * as React from "react";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { MainWorkspace } from "./MainWorkspace";
import { RightSidebar } from "./RightSidebar";
import { BottomPanel, BottomPanelBody } from "./BottomPanel";
import { useLayout, COLLAPSED_RAIL_SIZE } from "@/store/layout";
import { cn } from "@/lib/cn";

/**
 * Static fallback rendered during SSR and the first client paint.
 *
 * Layout matches the live `AppLayoutShell` shape (both sidebars open,
 * bottom collapsed) so hydration doesn't cause a width jump.
 */
function AppLayoutFallback({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden",
        "bg-[--color-bg-base] text-[--color-text-primary]",
      )}
    >
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:w-[26%]" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col">
          <MainWorkspace />
          {children}
        </div>
        <div className="hidden md:flex md:w-[26%]" aria-hidden="true" />
      </div>
      <BottomPanel />
    </div>
  );
}

/**
 * Root application shell.
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │                     TopBar                          │
 *   ├──────────┬───────────────────────────┬──────────────┤
 *   │          │                           │              │
 *   │ Sidebar  │       Workspace           │ Right Side   │
 *   │          │                           │              │
 *   ├──────────┴───────────────────────────┴──────────────┤
 *   │                  Bottom Panel (collapsed)           │
 *   └─────────────────────────────────────────────────────┘
 *
 * Layout-only. `useLayout` (zustand) is the single source of truth for
 * panel widths and collapse state. When a sidebar is "collapsed" we
 * shrink it to 0% width so the panel fully disappears — a floating
 * toggle button attached to the workspace edge stays visible so the
 * user can re-expand without hunting for a hidden control.
 */
export function AppLayout({ children }: { children?: React.ReactNode }): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <AppLayoutFallback>{children}</AppLayoutFallback>;
  }

  return <AppLayoutShell>{children}</AppLayoutShell>;
}

/**
 * Inner shell with the real resizable panels.
 *
 * Drag behaviour: while a sidebar is expanded, the drag handle only
 * enlarges it (toward the maximum). Shrinking below the default width
 * is reserved for the explicit collapse button — this prevents users
 * from accidentally clipping route labels.
 *
 * Collapse behaviour: clicking the collapse button sets the panel
 * width to `COLLAPSED_RAIL_SIZE` (0%). The panel itself is hidden,
 * but a floating toggle button anchored to the workspace edge lets
 * the user re-open it.
 */
function AppLayoutShell({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const layout = useLayout();

  return (
    <div
      className={cn(
        "flex h-screen w-screen flex-col overflow-hidden",
        "bg-[--color-bg-base] text-[--color-text-primary]",
      )}
    >
      <TopBar />

      <Group
        orientation="vertical"
        className="flex-1 overflow-hidden"
      >
        <Panel
          id="main"
          defaultSize={layout.bottomOpen ? 100 - layout.bottomHeight : 100}
          minSize={40}
        >
          <Group
            orientation="horizontal"
            className="h-full overflow-hidden"
          >
            <SidebarPanel
              side="left"
              collapsed={layout.leftCollapsed}
              width={layout.leftWidth}
              minWidth={layout.leftWidth}
              maxWidth={50}
              onWidthChange={layout.setLeftWidth}
              onToggle={layout.toggleLeft}
            />

            {/* Resize handle between sidebar and workspace. Hidden
                when the sidebar is collapsed (panel is 0% wide and
                nothing to drag against). */}
            {!layout.leftCollapsed ? (
              <ResizeHandle ariaLabel="Resize left sidebar" />
            ) : null}

            <Panel
              id="workspace"
              minSize={30}
              className="relative flex flex-col overflow-hidden"
            >
              <MainWorkspace />
              {children}

              {/* Floating toggle buttons — only visible while a
                  sidebar is hidden so the user can re-open it. */}
              {layout.leftCollapsed ? (
                <SidebarToggle
                  side="left"
                  collapsed
                  onToggle={layout.toggleLeft}
                />
              ) : null}
              {layout.rightCollapsed ? (
                <SidebarToggle
                  side="right"
                  collapsed
                  onToggle={layout.toggleRight}
                />
              ) : null}
            </Panel>

            {!layout.rightCollapsed ? (
              <ResizeHandle ariaLabel="Resize right sidebar" />
            ) : null}

            <SidebarPanel
              side="right"
              collapsed={layout.rightCollapsed}
              width={layout.rightWidth}
              minWidth={layout.rightWidth}
              maxWidth={50}
              onWidthChange={layout.setRightWidth}
              onToggle={layout.toggleRight}
            />
          </Group>
        </Panel>

        <BottomResizeHandle ariaLabel="Resize bottom panel" />

        <Panel
          id="bottom"
          defaultSize={layout.bottomOpen ? layout.bottomHeight : 0}
          minSize={layout.bottomOpen ? 12 : 0}
          maxSize={70}
          onResize={(size) => layout.setBottomHeight(Number(size))}
          className="flex flex-col overflow-hidden"
        >
          <BottomPanelBody />
        </Panel>
      </Group>

      {/* Always-visible thin strip even when collapsed */}
      <BottomPanel />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar panel                                                       */
/* ------------------------------------------------------------------ */

function SidebarPanel({
  side,
  collapsed,
  width,
  minWidth,
  maxWidth,
  onWidthChange,
  onToggle,
}: {
  side: "left" | "right";
  collapsed: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
  onWidthChange: (size: number) => void;
  onToggle: () => void;
}): React.ReactElement {
  const panelRef = usePanelRef();

  // Imperative resize — snap the panel to the right size whenever the
  // collapse flag or stored width changes. This is the single source
  // of truth for panel sizing; react-resizable-panels otherwise only
  // honours `defaultSize` on mount.
  React.useEffect(() => {
    const ref = panelRef.current;
    if (!ref) return;
    ref.resize(collapsed ? COLLAPSED_RAIL_SIZE : width);
  }, [collapsed, width, panelRef]);

  if (collapsed) {
    return (
      <Panel
        id={side}
        key={`${side}-collapsed`}
        panelRef={panelRef}
        defaultSize={COLLAPSED_RAIL_SIZE}
        minSize={COLLAPSED_RAIL_SIZE}
        maxSize={COLLAPSED_RAIL_SIZE}
        className="flex flex-col"
      />
    );
  }

  return (
    <Panel
      id={side}
      key={`${side}-full`}
      panelRef={panelRef}
      defaultSize={width}
      minSize={minWidth}
      maxSize={maxWidth}
      onResize={(size) => onWidthChange(Number(size))}
      className="flex flex-col"
    >
      {side === "left" ? <LeftSidebar /> : <RightSidebar />}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Floating sidebar toggle — visible only while the sidebar is hidden  */
/* ------------------------------------------------------------------ */

function SidebarToggle({
  side,
  collapsed: _collapsed,
  onToggle,
}: {
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const Icon = side === "left" ? ChevronRight : ChevronLeft;
  const label = side === "left" ? "Show Explorer" : "Show AI Assistant";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={cn(
        "group absolute top-3 z-30 flex h-7 items-center gap-1 rounded-md border border-border",
        "bg-bg-subtle px-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary shadow-sm",
        "transition-colors hover:bg-accent hover:text-accent-fg hover:border-accent",
        "focus-visible:bg-accent focus-visible:text-accent-fg focus-visible:outline-none",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{side === "left" ? "Explorer" : "Assistant"}</span>
    </button>
  );
}

function BottomResizeHandle({ ariaLabel }: { ariaLabel: string }): React.ReactElement {
  return (
    <Separator
      aria-label={ariaLabel}
      className={cn(
        "h-px shrink-0 bg-[--color-border] transition-colors",
        "hover:bg-[--color-accent]/40 data-[separator=active]:bg-[--color-accent]",
      )}
    />
  );
}

function ResizeHandle({ ariaLabel }: { ariaLabel: string }): React.ReactElement {
  return (
    <Separator
      aria-label={ariaLabel}
      className={cn(
        "w-px shrink-0 bg-[--color-border] transition-colors",
        "hover:bg-[--color-accent]/40 data-[separator=active]:bg-[--color-accent]",
      )}
    />
  );
}