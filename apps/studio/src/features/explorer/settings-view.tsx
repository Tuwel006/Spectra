"use client";

import { Settings as SettingsIcon } from "lucide-react";

import { EmptyState } from "@/components/ui";

/**
 * Settings placeholder — wired up to the explorer but the actual settings
 * UI lives in a future iteration.
 */
export function SettingsView() {
  return (
    <EmptyState
      icon={<SettingsIcon className="size-4" aria-hidden />}
      title="Settings"
      description="Workspace preferences will be configurable from here."
    />
  );
}