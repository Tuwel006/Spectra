"use client";

import * as React from "react";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { PanelLeftOpen, PanelRightOpen } from "lucide-react";

import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { MainWorkspace } from "./MainWorkspace";
import { RightSidebar } from "./RightSidebar";
import { BottomPanel, BottomPanelBody } from "./BottomPanel";
import { Tooltip } from "@/components/ui/tooltip";
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
            className="h-full min-w-0 overflow-hidden"
          >
            <SidebarPanel
              side="left"
              collapsed={layout.leftCollapsed}
              width={layout.leftWidth}
              minWidth={14}
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
              className="relative flex min-w-0 max-w-full flex-col overflow-hidden"
            >
              <MainWorkspace />
              {children}

              {/* Floating toggle — only visible while the left
                  sidebar is hidden so the user can re-open it. */}
              {layout.leftCollapsed ? (
                <SidebarToggle
                  side="left"
                  collapsed
                  onToggle={layout.toggleLeft}
                />
              ) : null}

              {/* Right AI Assistant renders as an OVERLAY drawer so
                  it never consumes workspace horizontal room. The
                  toggle lives in the top header. */}
              <RightDrawerOverlay
                open={!layout.rightCollapsed}
                onToggle={layout.toggleRight}
              />
            </Panel>
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
/* Right AI Assistant drawer overlay                                  */
/* ------------------------------------------------------------------ */

/**
 * The AI Assistant panel renders as a fixed overlay that slides in
 * from the right edge of the viewport. It never claims any of the
 * workspace's horizontal room; the toggle button lives in the top
 * header (TopBar) so it's always reachable.
 *
 * z-index layout:
 *   • drawer panel    — z-30
 *   • workspace       — normal flow
 *   • toggle button   — lives in TopBar (separate concern)
 */
function RightDrawerOverlay({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-y-0 right-0 z-30 w-[320px] max-w-[85vw] border-l border-border bg-bg-subtle shadow-2xl",
        "transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!open}
    >
      <div className="pointer-events-auto flex h-full flex-col">
        <RightSidebar />
      </div>
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
      defaultSize={width.toString() + "%"}
      minSize={minWidth.toString() + "%"}
      maxSize={maxWidth.toString() + "%"}
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
  // Panel-open icons signal "open this sidebar" — they're clearer than
  // bare chevrons and look at home next to the panel-icon row in the
  // sidebar headers. Wrapped in a circular floating button so the
  // affordance reads as a thumb-tab rather than a toolbar item.
  const Icon = side === "left" ? PanelLeftOpen : PanelRightOpen;
  const label = side === "left" ? "Show Explorer" : "Show AI Assistant";
  return (
    <Tooltip content={label} side={side === "left" ? "right" : "left"}>
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        className={cn(
          "group absolute top-3 z-30 grid h-8 w-8 place-items-center rounded-full",
          "border border-border bg-bg-subtle text-text-secondary shadow-sm",
          "transition-all hover:border-accent hover:bg-accent hover:text-accent-fg hover:shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base",
          side === "left" ? "left-3" : "right-3",
        )}
      >
        <Icon className="h-4 w-4 transition-transform group-hover:scale-110" aria-hidden />
      </button>
    </Tooltip>
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

/* ------------------------------------------------------------------ */
/* Bottom resize handle                                              */
/* ------------------------------------------------------------------ */