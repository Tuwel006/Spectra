"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * Toolbar above the workspace body.
 *
 * Currently empty by design — the AI Assistant toggle that used to live
 * here has been promoted into the right sidebar's own header so the
 * affordance always sits next to the surface it controls. A future
 * surface (request tabs actions, env switcher shortcut, …) will reuse
 * the right-aligned slot below.
 */
export function WorkspaceHeader(): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-9 shrink-0 items-center gap-1 border-b border-border bg-bg-subtle px-2",
      )}
    />
  );
}