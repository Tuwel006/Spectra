"use client";

import {
  Brain,
  Code2,
  FileText,
  FlaskConical,
  Gauge,
  Lock,
  ShieldAlert,
  Sparkles,
  TestTubes,
} from "lucide-react";

import { AiPanel, type AiPanelId } from "@/constants/explorer";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/cn";

interface PanelItem {
  readonly id: AiPanelId;
  readonly label: string;
  readonly icon: typeof Brain;
}

const PANELS: readonly PanelItem[] = [
  { id: AiPanel.Analysis, label: "Analysis", icon: Brain },
  { id: AiPanel.Suggestions, label: "Suggestions", icon: Sparkles },
  { id: AiPanel.GenerateClient, label: "Generate Client", icon: Code2 },
  { id: AiPanel.GenerateDocs, label: "Generate Docs", icon: FileText },
  { id: AiPanel.GenerateTests, label: "Generate Tests", icon: TestTubes },
  { id: AiPanel.ExplainEndpoint, label: "Explain Endpoint", icon: FlaskConical },
  { id: AiPanel.Security, label: "Security", icon: Lock },
  { id: AiPanel.Performance, label: "Performance", icon: Gauge },
  { id: AiPanel.Deprecation, label: "Deprecation", icon: ShieldAlert },
];

/**
 * Vertical navigation for the AI panel inside the right sidebar.
 * Matches the iconography of the left ActivityBar but specialised to
 * the AI feature surface.
 */
export function AiPanelNav() {
  const active = useUiStore((state) => state.aiPanel);
  const setActive = useUiStore((state) => state.setAiPanel);

  return (
    <nav
      aria-label="AI panel sections"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-2"
    >
      {PANELS.map((panel) => {
        const Icon = panel.icon;
        const isActive = active === panel.id;
        return (
          <button
            key={panel.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => setActive(panel.id)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-accent-subtle text-accent"
                : "text-text-muted hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="hidden lg:inline">{panel.label}</span>
          </button>
        );
      })}
    </nav>
  );
}