"use client";

import * as React from "react";
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels";

import { TopBar } from "./TopBar";
import { LeftSidebar } from "./LeftSidebar";
import { MainWorkspace } from "./MainWorkspace";
import { RightSidebar } from "./RightSidebar";
import { BottomPanel, BottomPanelBody } from "./BottomPanel";
import { useLayout, COLLAPSED_RAIL_SIZE } from "@/store/layout";
import { cn } from "@/lib/cn";
import { getSafeStorage } from "@/lib/safe-storage";

/**
 * Static fallback rendered during SSR and the first client paint.
 *
 * Kept identical between server and client (no `useDefaultLayout`, no
 * persisted widths) so React hydration matches byte-for-byte. The real
 * resizable shell mounts in a `useEffect` after hydration completes.
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
        <div className="hidden md:block md:w-[22%]" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col">
          <MainWorkspace />
          {children}
        </div>
        <div className="hidden md:block md:w-[22%]" aria-hidden="true" />
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
 * Layout-only. All panel sizes are percentages so the shell scales
 * from a 13" laptop to ultrawide. Collapse state is persisted to
 * `localStorage` via the `useLayout` zustand store; panel sizes are
 * persisted separately via `useDefaultLayout`.
 */
export function AppLayout({ children }: { children?: React.ReactNode }): React.ReactElement {
  // Mount-flag pattern: prevents hydration mismatch caused by
  // `useDefaultLayout` reading from `localStorage` and `useLayout`
  // rehydrating from the persisted zustand store — both produce values
  // that differ from what the server rendered.
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
 * Inner shell with the real resizable panels. Only mounted after the
 * first client paint so SSR and the very first client render agree.
 */
function AppLayoutShell({
  children,
}: {
  children?: React.ReactNode;
}): React.ReactElement {
  const layout = useLayout();

  const horizontal = useDefaultLayout({
    id: "spectra.shell.horizontal",
    panelIds: ["left", "workspace", "right"],
    storage: getSafeStorage(),
  });

  const vertical = useDefaultLayout({
    id: "spectra.shell.vertical",
    panelIds: ["main", "bottom"],
    storage: getSafeStorage(),
  });

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
        defaultLayout={vertical.defaultLayout}
        onLayoutChanged={layout.bottomOpen ? vertical.onLayoutChanged : undefined}
        className="flex-1 overflow-hidden"
      >
        <Panel
          id="main"
          defaultSize={layout.bottomOpen ? 100 - layout.bottomHeight : 100}
          minSize={40}
        >
          <Group
            orientation="horizontal"
            defaultLayout={horizontal.defaultLayout}
            onLayoutChanged={horizontal.onLayoutChanged}
            className="h-full overflow-hidden"
          >
            <LeftRail
              collapsed={layout.leftCollapsed}
              width={layout.leftWidth}
              onResize={layout.setLeftWidth}
            />

            <Panel id="workspace" minSize={30} className="flex flex-col overflow-hidden">
              <MainWorkspace />
              {children}
            </Panel>

            <RightRail
              collapsed={layout.rightCollapsed}
              width={layout.rightWidth}
              onResize={layout.setRightWidth}
            />
          </Group>
        </Panel>

        {layout.bottomOpen && (
          <>
            <BottomResizeHandle ariaLabel="Resize bottom panel" />
            <Panel
              id="bottom"
              defaultSize={layout.bottomHeight}
              minSize={12}
              maxSize={70}
              onResize={(size) => layout.setBottomHeight(Number(size))}
              className="flex flex-col overflow-hidden"
            >
              <BottomPanelBody />
            </Panel>
          </>
        )}
      </Group>

      {/* Always-visible thin strip even when collapsed */}
      {!layout.bottomOpen && <BottomPanel />}
    </div>
  );
}

function LeftRail({
  collapsed,
  width,
  onResize,
}: {
  collapsed: boolean;
  width: number;
  onResize: (size: number) => void;
}): React.ReactElement {
  const { toggleLeft } = useLayout();
  if (collapsed) {
    return (
      <Panel
        id="left"
        defaultSize={COLLAPSED_RAIL_SIZE}
        minSize={COLLAPSED_RAIL_SIZE}
        maxSize={COLLAPSED_RAIL_SIZE}
      >
        <CollapsedRail side="left" onClick={toggleLeft} />
      </Panel>
    );
  }
  return (
    <>
      <Panel
        id="left"
        defaultSize={width}
        minSize={14}
        maxSize={45}
        onResize={(size) => onResize(Number(size))}
        className="flex flex-col"
      >
        <LeftSidebar />
      </Panel>
      <ResizeHandle ariaLabel="Resize left sidebar" />
    </>
  );
}

function RightRail({
  collapsed,
  width,
  onResize,
}: {
  collapsed: boolean;
  width: number;
  onResize: (size: number) => void;
}): React.ReactElement {
  const { toggleRight } = useLayout();
  if (collapsed) {
    return (
      <Panel
        id="right"
        defaultSize={COLLAPSED_RAIL_SIZE}
        minSize={COLLAPSED_RAIL_SIZE}
        maxSize={COLLAPSED_RAIL_SIZE}
      >
        <CollapsedRail side="right" onClick={toggleRight} />
      </Panel>
    );
  }
  return (
    <>
      <ResizeHandle ariaLabel="Resize right sidebar" />
      <Panel
        id="right"
        defaultSize={width}
        minSize={18}
        maxSize={45}
        onResize={(size) => onResize(Number(size))}
        className="flex flex-col"
      >
        <RightSidebar />
      </Panel>
    </>
  );
}

function ResizeHandle({ ariaLabel }: { ariaLabel: string }): React.ReactElement {
  return (
    <Separator
      aria-label={ariaLabel}
      className={cn(
        "w-px bg-[--color-border] transition-colors",
        "hover:bg-[--color-accent]/40 data-[separator=active]:bg-[--color-accent]",
      )}
    />
  );
}

function BottomResizeHandle({ ariaLabel }: { ariaLabel: string }): React.ReactElement {
  return (
    <Separator
      aria-label={ariaLabel}
      className={cn(
        "h-px bg-[--color-border] transition-colors",
        "hover:bg-[--color-accent]/40 data-[separator=active]:bg-[--color-accent]",
      )}
    />
  );
}

function CollapsedRail({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expand ${side} panel`}
      className={cn(
        "h-full w-full border-[--color-border] bg-[--color-bg-subtle]",
        "hover:bg-[--color-bg-muted] transition-colors",
        side === "left" ? "border-r" : "border-l",
      )}
    />
  );
}