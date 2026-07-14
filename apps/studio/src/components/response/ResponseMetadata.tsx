"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  familyOf,
  isDefaultResponse,
  isSuccess,
  statusTone,
  type ResponseEntry,
} from "./response.types";

/**
 * Metadata card for the selected response — Status code, description,
 * content type, schema name, deprecated flag, default flag.
 */
export function ResponseMetadata({
  entry,
}: {
  entry: ResponseEntry | undefined;
}): React.ReactElement {
  if (!entry) {
    return (
      <EmptyState
        icon={<Info className="h-5 w-5" aria-hidden="true" />}
        title="No response selected"
        description="Pick a status code above to view its metadata."
        className="h-full"
      />
    );
  }

  const { status, response, schemaName, family } = entry;
  const success = isSuccess(status);
  const isDefault = isDefaultResponse(status);
  const tone = statusTone(status);
  const contentType = firstContentType(entry);
  const deprecated = readDeprecated(entry);

  const fields: { label: string; value: React.ReactNode }[] = [
    {
      label: "Status code",
      value: (
        <Badge tone={tone} size="md" className="font-mono">
          {status}
        </Badge>
      ),
    },
    {
      label: "Family",
      value: (
        <span className="text-xs text-text-secondary">{describeFamily(family)}</span>
      ),
    },
    {
      label: "Outcome",
      value: success ? (
        <Badge tone="success" size="sm">
          Success
        </Badge>
      ) : (
        <Badge tone={tone === "danger" ? "danger" : "warning"} size="sm">
          {tone === "danger" ? "Failure" : "Non-success"}
        </Badge>
      ),
    },
    {
      label: "Default response",
      value: isDefault ? (
        <Badge tone="subtle" size="sm">
          Yes
        </Badge>
      ) : (
        <span className="text-xs text-text-muted">No</span>
      ),
    },
    {
      label: "Deprecated",
      value: deprecated ? (
        <Badge tone="danger" size="sm">
          Deprecated
        </Badge>
      ) : (
        <span className="text-xs text-text-muted">No</span>
      ),
    },
    {
      label: "Content type",
      value: contentType ? (
        <code className="font-mono text-xs text-text-primary">{contentType}</code>
      ) : (
        <span className="text-xs italic text-text-muted">No body</span>
      ),
    },
    {
      label: "Schema",
      value: schemaName ? (
        <code className="font-mono text-xs text-accent">{schemaName}</code>
      ) : (
        <span className="text-xs italic text-text-muted">—</span>
      ),
    },
    {
      label: "Headers",
      value: (
        <span className="text-xs text-text-secondary">
          {response.headers.length} documented
        </span>
      ),
    },
  ];

  return (
    <ScrollArea className="h-full" orientation="vertical">
      <div className="flex flex-col gap-4 p-4">
        {response.description ? (
          <div className="rounded-md border border-border bg-bg-base p-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Description
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {response.description}
            </p>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-md border border-border bg-bg-base">
          <dl className="divide-y divide-border">
            {fields.map((f) => (
              <div
                key={f.label}
                className="grid grid-cols-[140px_1fr] items-center gap-3 px-3 py-2"
              >
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  {f.label}
                </dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ScrollArea>
  );
}

function describeFamily(family: ReturnType<typeof familyOf>): string {
  switch (family) {
    case "2xx":
      return "Successful (2xx)";
    case "3xx":
      return "Redirection (3xx)";
    case "4xx":
      return "Client error (4xx)";
    case "5xx":
      return "Server error (5xx)";
    case "1xx":
      return "Informational (1xx)";
    default:
      return "Default";
  }
}

function firstContentType(entry: ResponseEntry): string | undefined {
  const body = entry.response.body;
  if (!body) return undefined;
  return Object.keys(body.content)[0];
}

function readDeprecated(entry: ResponseEntry): boolean {
  const ext = (entry.response as unknown as { extensions?: Record<string, unknown> })
    .extensions;
  if (!ext) return false;
  return ext["x-deprecated"] === true;
}