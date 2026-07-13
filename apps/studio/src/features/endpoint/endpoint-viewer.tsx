"use client";

import { ScrollText } from "lucide-react";
import { useMemo } from "react";

import { useExplorerStore } from "@/store/explorer-store";
import { useTabsStore } from "@/store/tabs-store";
import { useUiStore } from "@/store/ui-store";
import { mockDocumentation } from "@/mock/documentation";
import { EmptyState } from "@/components/ui";
import { EndpointTab, type EndpointTabId } from "@/constants/explorer";
import { flattenOperations, operationKey } from "@/lib/tree";
import { readTags, readSecurity } from "@/types/extension";
import { EndpointHeader } from "./endpoint-header";
import { EndpointSubTabs } from "./endpoint-sub-tabs";
import { OverviewPanel } from "./panels/overview-panel";
import { ParametersPanel } from "./panels/parameters-panel";
import { HeadersPanel } from "./panels/headers-panel";
import { AuthorizationPanel } from "./panels/authorization-panel";
import { QueryPanel } from "./panels/query-panel";
import { BodyPanel } from "./panels/body-panel";
import { ExamplesPanel } from "./panels/examples-panel";
import { ResponsesPanel } from "./panels/responses-panel";
import { SchemaPanel } from "./panels/schema-panel";
import { TestsPanel } from "./panels/tests-panel";

const TAB_OPTIONS: ReadonlyArray<{ id: EndpointTabId; label: string }> = [
  { id: EndpointTab.Overview, label: "Overview" },
  { id: EndpointTab.Parameters, label: "Parameters" },
  { id: EndpointTab.Headers, label: "Headers" },
  { id: EndpointTab.Authorization, label: "Authorization" },
  { id: EndpointTab.Query, label: "Query" },
  { id: EndpointTab.Body, label: "Body" },
  { id: EndpointTab.Examples, label: "Examples" },
  { id: EndpointTab.Responses, label: "Responses" },
  { id: EndpointTab.Schema, label: "Schema" },
  { id: EndpointTab.Tests, label: "Tests" },
];

interface EndpointViewerProps {
  readonly tabId: string;
}

/**
 * Renders the header + sub-tab strip + active sub-tab body for the
 * currently selected endpoint tab.
 *
 * Data lookup:
 *  - The `tabId` is `pathId:METHOD` — we resolve it back to a
 *    `FlatOperation` from the flattened mock documentation.
 */
export function EndpointViewer({ tabId }: EndpointViewerProps) {
  const tab = useTabsStore((state) =>
    state.tabs.find((current) => current.id === tabId),
  );
  const endpointTab = useUiStore((state) => state.endpointTab);
  const setEndpointTab = useUiStore((state) => state.setEndpointTab);
  const favorites = useExplorerStore((state) => state.favorites);
  const toggleFavorite = useExplorerStore((state) => state.toggleFavorite);
  const pushToast = useUiStore((state) => state.pushToast);

  const operation = useMemo(() => {
    if (!tab) return null;
    const all = flattenOperations(mockDocumentation.paths);
    return all.find(
      (op) => operationKey(op.pathId, op.method) === tab.id,
    ) ?? null;
  }, [tab]);

  if (!tab || !operation) {
    return (
      <EmptyState
        icon={<ScrollText className="size-5" aria-hidden />}
        title="Endpoint not found"
        description="This tab references an endpoint that is no longer in the documentation."
        className="flex-1"
      />
    );
  }

  const isFavorite = favorites.includes(tab.id);
  const tags = readTags(operation.extensions);
  const security = readSecurity(operation.extensions);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EndpointHeader
        method={operation.method}
        url={tab.url}
        title={operation.name ?? tab.title}
        description={operation.description}
        tags={tags}
        security={security}
        favorite={isFavorite}
        onCopy={() => {
          navigator.clipboard?.writeText(`${operation.method} ${tab.url}`);
          pushToast({ title: "Copied to clipboard", variant: "success" });
        }}
        onShare={() => pushToast({ title: "Share link copied", variant: "info" })}
        onToggleFavorite={() => toggleFavorite(tab.id)}
        onRun={() =>
          pushToast({
            title: "Run",
            description: "Mock execution — backend not connected.",
            variant: "info",
          })
        }
        onHistory={() =>
          pushToast({
            title: "History",
            description: "Request history is not enabled in mock mode.",
            variant: "info",
          })
        }
      />

      <EndpointSubTabs
        tabId={tabId}
        activeTab={endpointTab}
        onTabChange={setEndpointTab}
        options={TAB_OPTIONS}
      >
        {(active) => {
          switch (active) {
            case EndpointTab.Overview:
              return <OverviewPanel operation={operation} />;
            case EndpointTab.Parameters:
              return <ParametersPanel operation={operation} />;
            case EndpointTab.Headers:
              return <HeadersPanel operation={operation} />;
            case EndpointTab.Authorization:
              return <AuthorizationPanel tabId={tabId} />;
            case EndpointTab.Query:
              return <QueryPanel operation={operation} />;
            case EndpointTab.Body:
              return <BodyPanel tabId={tabId} operation={operation} />;
            case EndpointTab.Examples:
              return <ExamplesPanel operation={operation} />;
            case EndpointTab.Responses:
              return <ResponsesPanel operation={operation} />;
            case EndpointTab.Schema:
              return <SchemaPanel operation={operation} />;
            case EndpointTab.Tests:
              return <TestsPanel operation={operation} />;
            default:
              return null;
          }
        }}
      </EndpointSubTabs>
    </div>
  );
}