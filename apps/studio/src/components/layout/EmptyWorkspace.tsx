"use client";

import * as React from "react";
import { Zap, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useExplorerStore } from "@/store/explorer.store";
import { useLayoutStore } from "@/store/layout.store";

/**
 * Shown in the workspace center when no endpoint tab is active.
 * Guides users to open an endpoint from the explorer.
 */
export function EmptyWorkspace() {
  const { openLeftSidebar } = useLayoutStore();
  const { setSearchQuery } = useExplorerStore();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center p-8">
      {/* Logo mark */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[--color-accent-subtle] ring-1 ring-[--color-accent]/20">
        <Zap className="h-8 w-8 text-[--color-accent]" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[--color-text-primary] tracking-tight">
          Welcome to Spectra Studio
        </h1>
        <p className="text-sm text-[--color-text-muted] max-w-sm leading-relaxed">
          Select an endpoint from the Explorer to view its documentation, parameters, schemas, and examples.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="default"
          size="lg"
          onClick={openLeftSidebar}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Open Explorer
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setSearchQuery("")}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          Search APIs
        </Button>
      </div>

      {/* Quick tips */}
      <div className="grid grid-cols-2 gap-3 text-left max-w-md w-full mt-4">
        {[
          { kbd: "⌘K", desc: "Open command palette" },
          { kbd: "⌘W", desc: "Close active tab" },
          { kbd: "⌘⇥", desc: "Switch between tabs" },
          { kbd: "/", desc: "Focus explorer search" },
        ].map(({ kbd, desc }) => (
          <div
            key={kbd}
            className="flex items-center gap-3 rounded-lg border border-[--color-border] px-3 py-2.5 bg-[--color-bg-subtle]"
          >
            <kbd className="flex items-center gap-0.5 rounded border border-[--color-border] bg-[--color-bg-muted] px-1.5 py-0.5 text-[11px] font-mono font-medium text-[--color-text-secondary] whitespace-nowrap">
              {kbd}
            </kbd>
            <span className="text-xs text-[--color-text-muted]">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
