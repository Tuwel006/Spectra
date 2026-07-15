"use client";

import * as React from "react";
import { Menu, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Explorer } from "@/components/explorer";
import { endpointToTab, useWorkspace } from "@/components/workspace";
import type { ExplorerEndpoint } from "@/components/explorer";
import { useLayout } from "@/store/layout";
import { cn } from "@/lib/cn";

/**
 * Left sidebar — explorer host.
 *
 * Layout (Postman-inspired):
 *   ┌──────────────────────────────────────┐
 *   │  [≡] [💾] [↗]                         │  ← action row (collapse / save / share)
 *   ├──────────────────────────────────────┤
 *   │  Explorer header · APIs · 37 Endpoints │
 *   │  Search                              │
 *   │  Tree (API folders, Pinned, Recent)  │
 *   │  Footer                              │
 *   └──────────────────────────────────────┘
 *
 * Activating an endpoint in the explorer opens a tab in the workspace
 * via the generic workspace store. The explorer never imports the
 * store directly — it just emits `onEndpointSelect`, and this
 * composition layer maps the explorer payload into a workspace tab.
 */
export function LeftSidebar(): React.ReactElement {
  const { toggleLeft } = useLayout();
  const { openTab } = useWorkspace();

  const handleEndpointSelect = React.useCallback(
    (endpoint: ExplorerEndpoint) => {
      openTab(
        endpointToTab({
          endpointId: endpoint.id,
          title: endpoint.summary ?? prettify(endpoint.url),
          method: endpoint.method,
          url: endpoint.url,
        }),
      );
    },
    [openTab],
  );

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-bg-subtle text-text-primary")}>
      <SidebarActionRow
        actions={
          <>
            <Tooltip content="Collapse sidebar" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Collapse sidebar"
                onClick={toggleLeft}
                className="h-7 w-7 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              >
                <Menu className="h-4 w-4" aria-hidden />
              </Button>
            </Tooltip>

            <Tooltip content="Save changes" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Save changes"
                onClick={() => undefined}
                className="h-7 w-7 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              >
                <Save className="h-4 w-4" aria-hidden />
              </Button>
              {/* TODO: wire save action. */}
            </Tooltip>

            <Tooltip content="Share workspace" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Share workspace"
                onClick={() => undefined}
                className="h-7 w-7 text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              >
                <Send className="h-4 w-4" aria-hidden />
              </Button>
              {/* TODO: wire share action. */}
            </Tooltip>
          </>
        }
      />

      <Explorer
        className="min-h-0 flex-1"
        onEndpointSelect={handleEndpointSelect}
      />
    </div>
  );
}

/**
 * Strip `{` `}` braces and leading slashes from a URL so it reads like
 * a friendly endpoint title (e.g. `/users/{id}` → `users/id`).
 */
function prettify(url: string): string {
  return url.replace(/[{}]/g, "").replace(/^\/+/, "");
}

/* ------------------------------------------------------------------ */
/* Action row                                                           */
/* ------------------------------------------------------------------ */

/**
 * Slim horizontal strip pinned to the top of the sidebar. Hosts the
 * icons that act on the sidebar itself rather than on whatever the user
 * has selected inside it.
 */
function SidebarActionRow({
  actions,
}: {
  actions: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-b border-border bg-bg-subtle px-2",
      )}
    >
      {actions}
    </div>
  );
}