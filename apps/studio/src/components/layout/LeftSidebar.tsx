"use client";

import * as React from "react";
import { PanelLeftClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Explorer } from "@/components/explorer";
import { useLayout } from "@/store/layout";

/**
 * Left sidebar — host for the explorer.
 *
 * Pure composition: the explorer owns its own state and chrome so this
 * component stays thin. The collapse action lives in the explorer's
 * header (injected via `headerActions`) so it's always attached to
 * the panel it controls — users can hide the panel from its own edge.
 */
export function LeftSidebar(): React.ReactElement {
  const { toggleLeft } = useLayout();

  return (
    <Explorer
      headerActions={
        <Tooltip content="Collapse sidebar" side="bottom">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Collapse sidebar"
            onClick={toggleLeft}
            className="h-7 w-7 text-text-secondary hover:bg-accent-subtle hover:text-accent"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </Tooltip>
      }
    />
  );
}