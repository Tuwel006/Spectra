"use client";

import { Sparkles } from "lucide-react";

import { AiPanel } from "@/constants/explorer";
import { useUiStore } from "@/store/ui-store";
import { Badge, EmptyState, ScrollArea } from "@/components/ui";

/**
 * Renders a placeholder for the active AI panel.
 *
 * All AI features are intentionally disabled — the studio is meant to
 * run against mock data only. The placeholders keep the surface
 * discoverable so users know which capabilities will land here.
 */
export function AiPanelContent() {
  const panel = useUiStore((state) => state.aiPanel);

  const meta = PANEL_META[panel];

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent" aria-hidden />
          <h3 className="text-sm font-semibold text-text-primary">{meta.title}</h3>
          <Badge variant="subtle">Soon</Badge>
        </div>
        <p className="text-xs text-text-muted">{meta.description}</p>

        {meta.suggestions.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {meta.suggestions.map((suggestion) => (
              <li
                key={suggestion}
                className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-2 text-xs text-text-secondary"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<Sparkles className="size-4" aria-hidden />}
            title="No suggestions yet"
            description="Open an endpoint to see AI-powered suggestions."
          />
        )}
      </div>
    </ScrollArea>
  );
}

interface PanelMeta {
  readonly title: string;
  readonly description: string;
  readonly suggestions: readonly string[];
}

const PANEL_META: Record<AiPanel, PanelMeta> = {
  [AiPanel.Analysis]: {
    title: "Analysis",
    description:
      "AI-generated overview of the selected endpoint: usage, complexity, and risk score.",
    suggestions: [
      "Endpoint complexity: low",
      "Auth required: yes",
      "Recommended caching: 60s",
    ],
  },
  [AiPanel.Suggestions]: {
    title: "Suggestions",
    description:
      "Inline improvements for documentation quality, naming and consistency.",
    suggestions: [
      "Add an example payload for the 422 response.",
      "Group path parameters into a single section.",
    ],
  },
  [AiPanel.GenerateClient]: {
    title: "Generate Client",
    description:
      "Auto-generate a typed client (TypeScript, Python, Go) for the selected endpoint.",
    suggestions: [],
  },
  [AiPanel.GenerateDocs]: {
    title: "Generate Docs",
    description:
      "Produce a long-form Markdown guide covering this endpoint and related flows.",
    suggestions: [],
  },
  [AiPanel.GenerateTests]: {
    title: "Generate Tests",
    description:
      "Draft happy-path and edge-case tests for the selected endpoint.",
    suggestions: [],
  },
  [AiPanel.ExplainEndpoint]: {
    title: "Explain Endpoint",
    description:
      "Plain-English explanation of what this endpoint does and when to use it.",
    suggestions: [],
  },
  [AiPanel.Security]: {
    title: "Security Analysis",
    description:
      "Detect missing authentication, sensitive parameters and OWASP concerns.",
    suggestions: [
      "Consider adding rate-limiting headers.",
      "Body field 'password' should be marked as writeOnly.",
    ],
  },
  [AiPanel.Performance]: {
    title: "Performance",
    description:
      "Highlight expensive operations and suggest caching/pagination strategies.",
    suggestions: [],
  },
  [AiPanel.Deprecation]: {
    title: "Deprecation",
    description:
      "Identify fields, parameters or responses that look stale or unused.",
    suggestions: [],
  },
};