import * as React from "react";
import { Hexagon, KeyboardIcon, Search } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * Premium empty state shown when the workspace has no open tabs.
 *
 * Sections:
 *   1. Brand mark + welcome headline
 *   2. Directional copy ("Select an endpoint from the Explorer")
 *   3. Keyboard shortcut hint grid
 *
 * No lorem ipsum — every word is task-oriented.
 */
export function WorkspaceEmpty(): React.ReactElement {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-hidden bg-bg-base",
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-6 py-12 text-center">
        <HeroMark />

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-text-primary">
            Welcome to Spectra Studio
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
            Select an endpoint from the Explorer to open a tab and inspect
            its request and response shapes.
          </p>
        </div>

        <ShortcutGrid />
      </div>
    </div>
  );
}

function HeroMark(): React.ReactElement {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle at center, var(--accent) 0%, transparent 70%)",
        }}
      />
      <Hexagon
        className="h-14 w-14 text-accent"
        strokeWidth={1.25}
        aria-hidden="true"
      />
    </div>
  );
}

function ShortcutGrid(): React.ReactElement {
  return (
    <dl className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
      <Shortcut label="Open endpoint" kbd="Click" icon={<Search className="h-3.5 w-3.5" />} />
      <Shortcut label="Toggle sidebar" kbd="⌘ B" icon={<KeyboardIcon className="h-3.5 w-3.5" />} />
      <Shortcut label="Search" kbd="⌘ K" icon={<KeyboardIcon className="h-3.5 w-3.5" />} />
    </dl>
  );
}

function Shortcut({
  label,
  kbd,
  icon,
}: {
  label: string;
  kbd: string;
  icon: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg-subtle px-4 py-3 text-left">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="font-mono text-xs text-text-primary">{kbd}</dd>
    </div>
  );
}
