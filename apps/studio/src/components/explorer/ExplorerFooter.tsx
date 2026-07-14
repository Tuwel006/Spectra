import * as React from "react";
import { HelpCircle, Settings as SettingsIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import { Button } from "@/components/ui/button";

/**
 * Bottom strip inside the explorer.
 *
 * Layout (VS Code inspired):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ 24 endpoints · 17 paths              [⚙] [?] v1.4.2      │
 *   └──────────────────────────────────────────────────────────┘
 *
 * The right cluster hosts affordances that don't deserve a row in
 * the tree: settings, help and the active documentation version.
 */
export function ExplorerFooter({
  endpointCount,
  pathCount,
  version,
  onSettingsClick,
  onHelpClick,
}: {
  endpointCount: number;
  pathCount: number;
  version?: string;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-7 shrink-0 items-center justify-between gap-2",
        "border-t border-border bg-bg-subtle px-2 text-[10px]",
        "text-text-muted",
      )}
    >
      <span className="font-medium uppercase tracking-wider">
        {endpointCount} {endpointCount === 1 ? "endpoint" : "endpoints"}
        <span className="mx-1 text-text-muted">·</span>
        {pathCount} {pathCount === 1 ? "path" : "paths"}
      </span>
      <div className="flex items-center gap-0.5">
        <FooterButton
          aria-label="Explorer settings"
          onClick={onSettingsClick}
        >
          <SettingsIcon className="h-3 w-3" aria-hidden="true" />
        </FooterButton>
        <FooterButton aria-label="Help" onClick={onHelpClick}>
          <HelpCircle className="h-3 w-3" aria-hidden="true" />
        </FooterButton>
        {version ? (
          <span className="ml-1 rounded-sm bg-bg-muted px-1 py-0.5 text-[9px] font-medium uppercase tracking-wider text-text-muted">
            v{version}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function FooterButton({
  children,
  ...props
}: React.ComponentProps<typeof Button>): React.ReactElement {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 text-text-muted hover:text-text-primary"
      {...props}
    >
      {children}
    </Button>
  );
}
