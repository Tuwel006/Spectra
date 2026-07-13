"use client";

import * as React from "react";

import { Explorer } from "@/components/explorer";

/**
 * Left sidebar — host for the explorer.
 *
 * Pure composition: the explorer owns its own state and chrome so this
 * component is a one-liner. Kept as its own module so future panes
 * (e.g. a "Definitions" sidebar) can sit side by side.
 */
export function LeftSidebar(): React.ReactElement {
  return <Explorer />;
}
