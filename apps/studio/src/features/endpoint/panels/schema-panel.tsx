"use client";

import { SchemaTree } from "@/components/common/schema-tree";
import { mockDocumentation } from "@/mock/documentation";
import type { FlatOperation } from "@/lib/tree";

interface SchemaPanelProps {
  readonly operation: FlatOperation;
}

/**
 * Schema sub-tab — renders the request schema (if any) and every response
 * schema declared on the operation as a recursive tree.
 */
export function SchemaPanel({ operation }: SchemaPanelProps) {
  const schemas = mockDocumentation.components.schemas;
  const requestSchema = pickRequestSchema(operation);
  const responseEntries = Object.entries(operation.responses).sort();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Request body
        </h2>
        {requestSchema ? (
          <SchemaTree schemas={schemas} rootSchemaId={requestSchema} />
        ) : (
          <p className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-4 text-center text-xs text-text-muted">
            This operation does not declare a request body schema.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Responses
        </h2>
        <div className="flex flex-col gap-4">
          {responseEntries.map(([code, response]) => {
            const id = response?.body?.content?.["application/json"]?.schema?.id;
            if (!id) {
              return (
                <div
                  key={code}
                  className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-3 text-xs text-text-muted"
                >
                  <span className="font-mono text-text-primary">{code}</span> —
                  no response schema declared.
                </div>
              );
            }
            return (
              <div key={code} className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text-primary">
                    {code}
                  </span>
                  <span className="text-xs text-text-muted">{response?.description}</span>
                </div>
                <SchemaTree schemas={schemas} rootSchemaId={id} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function pickRequestSchema(operation: FlatOperation): string | undefined {
  const body = operation.request.body;
  if (!body) return undefined;
  const media = body.content["application/json"] ?? body.content["multipart/form-data"];
  return media?.schema?.id;
}