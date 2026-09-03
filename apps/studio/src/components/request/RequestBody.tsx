"use client";

import * as React from "react";
import { Braces } from "lucide-react";
import type { Operation } from "@spectra/core";

import { cn } from "@/lib/cn";
import { useRequestDraftStore } from "./request.store";
import {
  BODY_TYPE_CONTENT_TYPE,
  collectParamHints,
  type BodyType,
} from "./request.types";

import { BodyTypeSelector } from "./BodyTypeSelector";
import { JsonEditor } from "./JsonEditor";
import { JsonSchemaPanel } from "./JsonSchemaPanel";
import { TextEditor } from "./TextEditor";
import { XmlEditor } from "./XmlEditor";
import { MultipartEditor } from "./MultipartEditor";
import { FormUrlEncodedEditor } from "./FormUrlEncodedEditor";
import { BinaryUpload } from "./BinaryUpload";

import { SmartForm } from "@/components/workspace/SmartForm";
import {
  buildInitialValue,
  defaultResolveReference,
  parseJsonSafe,
  stringifyJsonSafe,
} from "@/components/workspace/smartFormInference";

/**
 * Body editor — dispatches to the right editor for the selected
 * {@link BodyType}. Switching body types changes the underlying text
 * via `patchDraft`. Other body kinds (multipart / url-encoded / binary)
 * own their state separately so they're not lost on toggle.
 *
 * <p>The body type dropdown is the single piece of chrome shared by
 * every flavour; the chosen editor renders fully below it — including
 * its own toolbar — so the active editor never sits below redundant
 * outer controls.</p>
 */
export function RequestBody({
  endpointId,
  operation,
}: {
  endpointId: string;
  operation?: Operation;
}): React.ReactElement {
  const type = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.bodyType ?? "smart-form",
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <BodyHeader
        type={type}
        onChange={(next) => patch(endpointId, "bodyType", next)}
      />

      <div
        className={cn(
          "flex-1 overflow-hidden",
          type === "json" ? "p-0" : "p-3",
        )}
      >
        <BodySlot endpointId={endpointId} type={type} operation={operation} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header — just the type dropdown                                     */
/* ------------------------------------------------------------------ */

function BodyHeader({
  type,
  onChange,
}: {
  type: BodyType;
  onChange: (next: BodyType) => void;
}): React.ReactElement {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border/70 bg-bg-base px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        Body
      </span>
      <BodyTypeSelector value={type} onChange={onChange} />
      <span className="inline-flex items-center gap-1 rounded border border-border/60 bg-bg-subtle px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-secondary">
        {type === "json" ? (
          <Braces className="h-3 w-3 text-text-muted" aria-hidden="true" />
        ) : null}
        {BODY_TYPE_CONTENT_TYPE[type]}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Slot — picks the right editor                                       */
/* ------------------------------------------------------------------ */

function BodySlot({
  endpointId,
  type,
  operation,
}: {
  endpointId: string;
  type: BodyType;
  operation?: Operation;
}): React.ReactElement {
  const patch = useRequestDraftStore((s) => s.patchDraft);
  const text = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.bodyText ?? "",
  );

  switch (type) {
    case "smart-form":
      return <SmartFormSlot endpointId={endpointId} text={text} operation={operation} />;
    case "json":
      return (
        <JsonBodySlot endpointId={endpointId} text={text} operation={operation} />
      );
    case "raw":
      return (
        <TextEditor
          language="text"
          value={text}
          onChange={(v) => patch(endpointId, "bodyText", v)}
        />
      );
    case "xml":
      return (
        <XmlEditor
          value={text}
          onChange={(v) => patch(endpointId, "bodyText", v)}
        />
      );
    case "graphql":
      return (
        <TextEditor
          language="graphql"
          value={text}
          onChange={(v) => patch(endpointId, "bodyText", v)}
        />
      );
    case "form-data":
      return <MultipartEditor endpointId={endpointId} />;
    case "url-encoded":
      return <FormUrlEncodedEditor endpointId={endpointId} />;
    case "binary":
      return <BinaryUpload />;
  }
}

/**
 * Smart Form slot — looks up the request schema for the operation,
 * renders the {@link SmartForm}, and round-trips the value into
 * `bodyText` as JSON so the Monaco JSON view stays in sync.
 */
function SmartFormSlot({
  endpointId,
  text,
  operation,
}: {
  endpointId: string;
  text: string;
  operation?: Operation;
}): React.ReactElement {
  const patch = useRequestDraftStore((s) => s.patchDraft);
  const schema = React.useMemo(() => {
    if (!operation) return undefined;
    const hints = collectParamHints(operation);
    return hints.bodySchemaId
      ? defaultResolveReference(hints.bodySchemaId)
      : undefined;
  }, [operation]);

  if (!schema) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed border-border/70 bg-bg-subtle/40 px-6 text-center">
        <p className="text-xs leading-relaxed text-text-muted">
          No JSON schema is declared for this request body. Switch the
          body type to <span className="font-mono">JSON</span> to write
          one manually.
        </p>
      </div>
    );
  }

  const value = React.useMemo(
    () => parseJsonSafe(text) ?? buildInitialValue(schema, defaultResolveReference),
    [text, schema],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-border/70 bg-bg-base">
      <div className="flex-1 overflow-y-auto">
        <SmartForm
          schema={schema}
          value={value}
          onChange={(next) => patch(endpointId, "bodyText", stringifyJsonSafe(next))}
          resolveReference={defaultResolveReference}
        />
      </div>
      <details className="border-t border-border bg-bg-subtle px-4 py-2 text-[11px] text-text-muted">
        <summary className="cursor-pointer select-none font-medium uppercase tracking-wider text-text-secondary">
          View JSON
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-sm border border-border/60 bg-bg-base p-2 font-mono text-[11px] text-text-primary">
          {stringifyJsonSafe(value)}
        </pre>
      </details>
    </div>
  );
}

/**
 * JSON body slot — resolves the body {@link Schema} (when one is
 * declared on the operation) and renders a collapsible
 * {@link JsonSchemaPanel} above the {@link JsonEditor} so the user can
 * see the expected field names, types, and required/optional flags
 * while they edit raw JSON. The panel is collapsed by default so the
 * editor fills as much of the available area as possible; clicking the
 * header expands the field reference. When no schema is declared the
 * editor fills the slot on its own.
 */
function JsonBodySlot({
  endpointId,
  text,
  operation,
}: {
  endpointId: string;
  text: string;
  operation?: Operation;
}): React.ReactElement {
  const patch = useRequestDraftStore((s) => s.patchDraft);
  const schema = React.useMemo(() => {
    if (!operation) return undefined;
    const hints = collectParamHints(operation);
    return hints.bodySchemaId
      ? defaultResolveReference(hints.bodySchemaId)
      : undefined;
  }, [operation]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2">
      {schema ? <JsonSchemaPanel schema={schema} defaultOpen={false} /> : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <JsonEditor
          value={text}
          onChange={(v) => patch(endpointId, "bodyText", v)}
        />
      </div>
    </div>
  );
}