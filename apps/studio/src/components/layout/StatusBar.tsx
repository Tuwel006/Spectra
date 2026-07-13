"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { GitBranch, Wifi, Package, AlertCircle, CheckCircle, Save } from "lucide-react";
import { mockDocumentation } from "@/mock/documentation";

/**
 * Bottom status bar — always visible, full width.
 * Shows connection status, parser info, endpoint count, errors, and git branch.
 * All data is static/mock for the current phase.
 */
export function StatusBar() {
  const pathCount = Object.keys(mockDocumentation.paths).length;
  const opCount = Object.values(mockDocumentation.paths).reduce(
    (sum, path) => sum + Object.keys(path.operations).length,
    0
  );

  return (
    <footer
      className={cn(
        "flex h-6 shrink-0 items-center justify-between px-3",
        "border-t border-[--color-border] bg-[--color-accent] text-white",
        "text-[10px] font-medium"
      )}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </div>
        <Separator />
        <div className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          <span>Parser: NestJS</span>
        </div>
        <Separator />
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
          <span>Watching…</span>
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-3">
        <span>{opCount} Endpoints</span>
        <Separator />
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>No Errors</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span>v0.1.0</span>
        <Separator />
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>
        <Separator />
        <div className="flex items-center gap-1">
          <Save className="h-3 w-3" />
          <span>Auto Save</span>
        </div>
      </div>
    </footer>
  );
}

function Separator() {
  return <span className="opacity-40">·</span>;
}
