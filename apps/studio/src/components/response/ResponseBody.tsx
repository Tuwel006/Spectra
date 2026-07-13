"use client";

import * as React from "react";
import { ImageIcon, Music2, Film, FileText, Box } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";

import { ResponseJsonViewer } from "./ResponseJsonViewer";
import { ResponseToolbar } from "./ResponseToolbar";
import { ResponseSchema } from "./ResponseSchema";
import { ResponseExamples } from "./ResponseExamples";
import type {
  ResponseEntry,
  ResponseViewMode,
} from "./response.types";
import type { ResponseExample } from "./response.types";

/**
 * Body of the response viewer. Dispatches to the right sub-component
 * based on the selected view mode. Renders the toolbar above the body
 * regardless of mode so Copy / Download stay accessible.
 */
export function ResponseBody({
  entry,
  viewMode,
  raw,
  body,
  examples,
  search,
  onSearchChange,
  expandedAll,
  onToggleExpanded,
  filename,
}: {
  entry: ResponseEntry | undefined;
  viewMode: ResponseViewMode;
  raw: string;
  body: unknown;
  examples: readonly ResponseExample[];
  search: string;
  onSearchChange: (next: string) => void;
  expandedAll: boolean;
  onToggleExpanded: () => void;
  filename: string;
}): React.ReactElement {
  if (!entry) {
    return (
      <div className="flex h-full flex-col">
        <ResponseToolbar
          viewMode={viewMode}
          body={undefined}
          raw=""
          search={search}
          onSearchChange={onSearchChange}
          expandedAll={expandedAll}
          onToggleExpanded={onToggleExpanded}
          filename={filename}
          contentType="application/json"
          disabled
        />
        <EmptyState
          icon={<Box className="h-5 w-5" aria-hidden="true" />}
          title="No response selected"
          description="Pick a status code above to inspect the documented response."
          className="flex-1"
        />
      </div>
    );
  }

  const contentType = firstContentType(entry);

  return (
    <div className="flex h-full flex-col">
      <ResponseToolbar
        viewMode={viewMode}
        body={body}
        raw={raw}
        search={search}
        onSearchChange={onSearchChange}
        expandedAll={expandedAll}
        onToggleExpanded={onToggleExpanded}
        filename={filename}
        contentType={contentType ?? "application/json"}
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        {viewMode === "pretty" ? (
          <PrettyView
            body={body}
            search={search}
            expandedAll={expandedAll}
          />
        ) : null}
        {viewMode === "raw" ? (
          <RawView value={raw} />
        ) : null}
        {viewMode === "preview" ? <PreviewPlaceholder entry={entry} /> : null}
        {viewMode === "schema" ? (
          <SchemaView entry={entry} />
        ) : null}
        {viewMode === "examples" ? (
          <ExamplesView entry={entry} examples={examples} />
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* View implementations                                                  */
/* ------------------------------------------------------------------ */

function PrettyView({
  body,
  search,
  expandedAll,
}: {
  body: unknown;
  search: string;
  expandedAll: boolean;
}): React.ReactElement {
  if (body === null || body === undefined) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        title="Empty body"
        description="This response has no body to render."
        className="h-full"
      />
    );
  }
  return (
    <ScrollArea className="h-full" orientation="vertical">
      <div className={cn("min-h-full")}>
        <ResponseJsonViewer
          value={body}
          expandedAll={expandedAll}
          search={search}
        />
      </div>
    </ScrollArea>
  );
}

function RawView({ value }: { value: string }): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  if (value.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        title="Empty body"
        description="This response has no body to render."
        className="h-full"
      />
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end gap-2 border-b border-border bg-bg-subtle px-3 py-1">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            } catch {
              // ignore
            }
          }}
          className="text-[10px] uppercase tracking-wider text-text-muted hover:text-text-primary"
        >
          {copied ? "Copied" : "Copy raw"}
        </button>
      </div>
      <textarea
        readOnly
        value={value}
        aria-label="Raw response body"
        spellCheck={false}
        className={cn(
          "h-full w-full resize-none bg-bg-base p-3 font-mono text-xs text-text-primary",
          "focus:outline-none",
        )}
      />
    </div>
  );
}

function PreviewPlaceholder({ entry }: { entry: ResponseEntry }): React.ReactElement {
  const ct = firstContentType(entry)?.toLowerCase() ?? "";
  const icon = pickPreviewIcon(ct);
  const label = pickPreviewLabel(ct);
  return (
    <EmptyState
      icon={icon}
      title={`${label} preview`}
      description="The preview renderer ships in a later phase. Today the documented payload is still available in Pretty / Raw / Schema / Example tabs."
      className="h-full"
    />
  );
}

function SchemaView({ entry }: { entry: ResponseEntry }): React.ReactElement {
  if (!entry.schemaName) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        title="No schema"
        description="This response has no documented schema."
        className="h-full"
      />
    );
  }
  return (
    <ScrollArea className="h-full" orientation="vertical">
      <ResponseSchema schemaName={entry.schemaName} />
    </ScrollArea>
  );
}

function ExamplesView({
  entry,
  examples,
}: {
  entry: ResponseEntry;
  examples: readonly ResponseExample[];
}): React.ReactElement {
  const matched = examples.find((ex) => ex.id.endsWith(`:${entry.status}`));
  if (!matched) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        title="No example"
        description="No example payload is documented for this status."
        className="h-full"
      />
    );
  }
  return (
    <ScrollArea className="h-full" orientation="vertical">
      <ResponseExamples examples={[matched]} selectedId={matched.id} />
    </ScrollArea>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function firstContentType(entry: ResponseEntry): string | undefined {
  const body = entry.response.body;
  if (!body) return undefined;
  return Object.keys(body.content)[0];
}

function pickPreviewIcon(contentType: string): React.ReactElement {
  if (contentType.startsWith("image/")) return <ImageIcon className="h-5 w-5" aria-hidden="true" />;
  if (contentType.startsWith("audio/")) return <Music2 className="h-5 w-5" aria-hidden="true" />;
  if (contentType.startsWith("video/")) return <Film className="h-5 w-5" aria-hidden="true" />;
  return <FileText className="h-5 w-5" aria-hidden="true" />;
}

function pickPreviewLabel(contentType: string): string {
  if (contentType.startsWith("image/")) return "Image";
  if (contentType.startsWith("audio/")) return "Audio";
  if (contentType.startsWith("video/")) return "Video";
  if (contentType === "text/html") return "HTML";
  if (contentType === "application/pdf") return "PDF";
  return "Binary";
}