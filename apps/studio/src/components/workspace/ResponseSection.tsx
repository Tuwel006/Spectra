"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";

import {
  collectResponseExamples,
  collectResponses,
  type ResponseExample,
} from "@/components/response";
import { useResponseSlice, useResponseViewerStore } from "@/components/response";
import type { Operation } from "@spectra/core";

import { useWorkspaceStore } from "./store/workspaceStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { ExamplesTab } from "./response/ExamplesTab";

/**
 * Right-side response panel.
 *
 * <p>Layout — full area, single Examples tab:</p>
 *
 * <pre>
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Response                                       ⌄         │  ← collapsible header
 *   ├──────────────────────────────────────────────────────────┤
 *   │ EXAMPLE  [ 200 Success ▾ ]   18 examples                  │  ← dropdown
 *   ├──────────────────────────────────────────────────────────┤
 *   │ {                                                          │
 *   │   "id": "usr_42",                                          │  ← body (full width)
 *   │   "name": "Ada",                                           │
 *   │   …                                                        │
 *   │ }                                                          │
 *   └──────────────────────────────────────────────────────────┘
 * </pre>
 *
 * <p>The user picks any documented response example from the
 * dropdown. The body + headers render below in full width — no
 * documentation/runtime split, no nested info pane. The selected
 * example is persisted per endpoint via the response viewer store.</p>
 */
export function ResponseSection({
  tabId,
  operation,
}: {
  tabId: string;
  operation: Operation;
}): React.ReactElement {
  const endpointId = operation.id;

  // Documented responses + synthesized examples — computed once per
  // operation. The examples carry status code, family, description,
  // and a synthesised body placeholder built from the schema.
  const responses = React.useMemo(
    () => collectResponses(operation),
    [operation],
  );
  const examples = React.useMemo<readonly ResponseExample[]>(
    () => collectResponseExamples(operation),
    [operation],
  );

  const slice = useResponseSlice(endpointId);
  const setSelectedExample = useResponseViewerStore(
    (s) => s.setSelectedExample,
  );

  // If the user already has a selection for this endpoint, keep it;
  // otherwise default to the first example (a 2xx success when one
  // exists).
  const fallbackId = examples[0]?.id;
  const activeId =
    slice.selectedExampleId && examples.some((e) => e.id === slice.selectedExampleId)
      ? slice.selectedExampleId
      : fallbackId;
  const activeExample = activeId
    ? examples.find((e) => e.id === activeId) ?? examples[0]
    : undefined;

  const sectionExpanded = useWorkspaceStore(
    (s) => s.ui[tabId]?.sections.response ?? true,
  );
  const toggleSection = useWorkspaceStore((s) => s.toggleSection);

  return (
    <CollapsibleSection
      id={`resp-${tabId}`}
      title="Response"
      open={sectionExpanded}
      onToggle={() => toggleSection(tabId, "response")}
      toolbar={
        <div className="flex shrink-0 items-center gap-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <Sparkles className="h-3 w-3" aria-hidden />
          Examples
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        <ExamplesTab
          examples={examples}
          responses={responses}
          selectedId={activeExample?.id}
          onSelect={(id) => setSelectedExample(endpointId, id)}
        />
      </div>
    </CollapsibleSection>
  );
}