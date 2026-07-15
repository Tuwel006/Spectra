"use client";

import * as React from "react";
import type { Operation } from "@spectra/core";

import { useRequestDraftStore } from "./request.store";
import {
  BODY_TYPE_CONTENT_TYPE,
  collectParamHints,
  type BodyType,
} from "./request.types";

import { BodyTypeSelector } from "./BodyTypeSelector";
import { JsonEditor } from "./JsonEditor";
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
  const text = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.bodyText ?? "",
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-bg-subtle px-4 py-2">
        <div className="flex items-center gap-2">
          <BodyTypeSelector
            value={type}
            onChange={(next) => patch(endpointId, "bodyType", next)}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {BODY_TYPE_CONTENT_TYPE[type]}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-text-muted">
          {text.length} chars
        </span>
      </div>

      <div className="flex-1 overflow-hidden">
        <BodySlot
          endpointId={endpointId}
          type={type}
          text={text}
          operation={operation}
        />
      </div>
    </div>
  );
}

function BodySlot({
  endpointId,
  type,
  text,
  operation,
}: {
  endpointId: string;
  type: BodyType;
  text: string;
  operation?: Operation;
}): React.ReactElement {
  const patch = useRequestDraftStore((s) => s.patchDraft);
  switch (type) {
    case "smart-form":
      return <SmartFormSlot endpointId={endpointId} text={text} operation={operation} />;
    case "json":
      return (
        <JsonEditor
          value={text}
          onChange={(v) => patch(endpointId, "bodyText", v)}
        />
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
      <div className="flex h-full items-center justify-center px-6 text-center">
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
    <div className="flex h-full flex-col">
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
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-bg-base p-2 font-mono text-[11px] text-text-primary">
          {stringifyJsonSafe(value)}
        </pre>
      </details>
    </div>
  );
}
