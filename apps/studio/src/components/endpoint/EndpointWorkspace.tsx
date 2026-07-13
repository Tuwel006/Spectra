"use client";

import * as React from "react";
import { InnerTabBar } from "@/components/tabs/InnerTabBar";
import { OverviewPanel } from "./OverviewPanel";
import { ParameterTable } from "@/components/request/ParameterTable";
import { RequestBodyPanel } from "@/components/request/RequestBodyPanel";
import { ResponsePanel } from "@/components/response/ResponsePanel";
import type { EndpointEntry } from "@/types";

interface EndpointWorkspaceProps {
  endpoint: EndpointEntry;
}

const makeTabs = (endpoint: EndpointEntry) => {
  const { operation } = endpoint;
  const pathCount = operation.request.pathParameters.length;
  const queryCount = operation.request.queryParameters.length;
  const headerCount = operation.request.headers.length;
  const hasBody = !!operation.request.body;
  const responseCount = Object.keys(operation.responses).length;

  return [
    { id: "overview",  label: "Overview" },
    { id: "params",    label: "Params",   badge: pathCount + queryCount || undefined },
    { id: "headers",   label: "Headers",  badge: headerCount || undefined },
    { id: "auth",      label: "Auth" },
    { id: "body",      label: "Body",     badge: hasBody ? undefined : undefined },
    { id: "responses", label: "Responses", badge: responseCount || undefined },
    { id: "examples",  label: "Examples" },
    { id: "schema",    label: "Schema" },
  ];
};

/**
 * Main endpoint workspace.
 * Renders the inner tab bar and the appropriate panel for the active tab.
 * Each tab is a separate, focused view into one aspect of the endpoint.
 */
export function EndpointWorkspace({ endpoint }: EndpointWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const tabs = makeTabs(endpoint);
  const { operation } = endpoint;

  // Reset to overview when the endpoint changes
  React.useEffect(() => {
    setActiveTab("overview");
  }, [endpoint.pathId, endpoint.method]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <InnerTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && (
          <OverviewPanel operation={operation} />
        )}

        {activeTab === "params" && (
          <div className="flex flex-col gap-6 p-6 max-w-3xl">
            {operation.request.pathParameters.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
                  Path Parameters
                </h3>
                <ParameterTable parameters={operation.request.pathParameters} title="path parameters" />
              </section>
            )}
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
                Query Parameters
              </h3>
              <ParameterTable parameters={operation.request.queryParameters} title="query parameters" />
            </section>
          </div>
        )}

        {activeTab === "headers" && (
          <div className="p-6 max-w-3xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
              Request Headers
            </h3>
            <div className="rounded-lg border border-[--color-border] overflow-hidden">
              {operation.request.headers.length === 0 ? (
                <div className="py-8 text-center text-xs text-[--color-text-muted]">
                  No request headers defined.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[--color-border] bg-[--color-bg-muted]">
                      <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Required</th>
                      <th className="px-4 py-2 text-left font-semibold text-[--color-text-secondary]">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operation.request.headers.map((h, i) => (
                      <tr key={h.id} className="border-b border-[--color-border] last:border-0 hover:bg-[--color-bg-subtle]">
                        <td className="px-4 py-2.5 font-mono text-[--color-text-primary]">{h.name ?? h.id}</td>
                        <td className="px-4 py-2.5">
                          {h.required ? (
                            <span className="text-red-500 text-[10px] font-semibold uppercase">required</span>
                          ) : (
                            <span className="text-[--color-text-disabled] text-[10px]">optional</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[--color-text-muted]">{h.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "auth" && (
          <div className="p-6 max-w-3xl">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
              Authorization
            </h3>
            <div className="rounded-lg border border-[--color-border] p-6 bg-[--color-bg-subtle]">
              {operation.extensions?.["x-security"] ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[--color-text-primary]">
                      {operation.extensions["x-security"] as string}
                    </span>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-green-500/10 text-green-500 font-medium">
                      JWT Bearer
                    </span>
                  </div>
                  <p className="text-sm text-[--color-text-muted]">
                    This endpoint requires a valid JWT bearer token in the{" "}
                    <code className="font-mono text-[--color-accent]">Authorization</code> header.
                  </p>
                  <div className="rounded border border-[--color-border] bg-[--color-bg-muted] p-3 font-mono text-xs text-[--color-text-secondary]">
                    Authorization: Bearer &lt;access_token&gt;
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[--color-text-muted]">
                  This endpoint does not require authentication.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "body" && (
          <div className="h-full">
            <RequestBodyPanel body={operation.request.body} className="h-full" />
          </div>
        )}

        {activeTab === "responses" && (
          <ResponsePanel operation={operation} className="h-full" />
        )}

        {activeTab === "examples" && (
          <ExamplesPanel operation={operation} />
        )}

        {activeTab === "schema" && (
          <SchemaPanel operation={operation} />
        )}
      </div>
    </div>
  );
}

function ExamplesPanel({ operation }: { operation: any }) {
  const example = operation.extensions?.["x-example"];
  return (
    <div className="p-6 max-w-3xl">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
        Examples
      </h3>
      {example ? (
        <pre className="rounded-lg border border-[--color-border] bg-[--color-bg-muted] p-4 text-xs font-mono text-[--color-text-secondary] overflow-auto">
          {JSON.stringify(example, null, 2)}
        </pre>
      ) : (
        <div className="rounded-lg border border-dashed border-[--color-border] py-12 text-center">
          <p className="text-sm text-[--color-text-muted]">No examples defined for this endpoint.</p>
        </div>
      )}
    </div>
  );
}

function SchemaPanel({ operation }: { operation: any }) {
  const schemas = new Set<string>();
  const body = operation.request.body;
  if (body) {
    for (const media of Object.values(body.content as Record<string, any>)) {
      if (media?.schema?.id) schemas.add(media.schema.id);
    }
  }
  for (const resp of Object.values(operation.responses as Record<string, any>)) {
    if (resp?.body?.content) {
      for (const media of Object.values(resp.body.content as Record<string, any>)) {
        if ((media as any)?.schema?.id) schemas.add((media as any).schema.id);
      }
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[--color-text-muted] mb-3">
        Referenced Schemas
      </h3>
      {schemas.size > 0 ? (
        <div className="flex flex-col gap-2">
          {Array.from(schemas).map((schemaId) => (
            <div
              key={schemaId}
              className="flex items-center gap-2 rounded-md border border-[--color-border] px-4 py-3 bg-[--color-bg-subtle]"
            >
              <span className="font-mono text-sm text-[--color-accent]">{schemaId}</span>
              <span className="text-xs text-[--color-text-muted] ml-auto">
                See Components → Schemas
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[--color-border] py-12 text-center">
          <p className="text-sm text-[--color-text-muted]">No schemas referenced.</p>
        </div>
      )}
    </div>
  );
}
