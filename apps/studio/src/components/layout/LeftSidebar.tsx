"use client";

import * as React from "react";
import { PanelLeftClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Explorer } from "@/components/explorer";
import { useLayout } from "@/store/layout";

/**
 * Left sidebar — host for the explorer.
 *
 * Pure composition: the explorer owns its own state and chrome so this
 * component stays thin. The collapse action lives on the sidebar itself
 * (injected into the Explorer's header) so users can hide the panel from
 * the panel boundary — the workspace toolbar is no longer the only way
 * to toggle it.
 */
export function LeftSidebar(): React.ReactElement {
  const { toggleLeft } = useLayout();

  return (
    <Explorer
      headerActions={
        <Button
          variant="ghost"
          size="icon"
          aria-label="Collapse sidebar"
          onClick={toggleLeft}
          className="h-6 w-6"
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}
