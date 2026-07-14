"use client";

import * as React from "react";

import { useRequestDraftStore } from "./request.store";
import { BODY_TYPE_CONTENT_TYPE, type BodyType } from "./request.types";

import { BodyTypeSelector } from "./BodyTypeSelector";
import { JsonEditor } from "./JsonEditor";
import { TextEditor } from "./TextEditor";
import { XmlEditor } from "./XmlEditor";
import { MultipartEditor } from "./MultipartEditor";
import { FormUrlEncodedEditor } from "./FormUrlEncodedEditor";
import { BinaryUpload } from "./BinaryUpload";

/**
 * Body editor — dispatches to the right editor for the selected
 * {@link BodyType}. Switching body types changes the underlying text
 * via `patchDraft`. Other body kinds (multipart / url-encoded / binary)
 * own their state separately so they're not lost on toggle.
 */
export function RequestBody({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const type = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.bodyType ?? "json",
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
        <BodySlot endpointId={endpointId} type={type} text={text} />
      </div>
    </div>
  );
}

function BodySlot({
  endpointId,
  type,
  text,
}: {
  endpointId: string;
  type: BodyType;
  text: string;
}): React.ReactElement {
  const patch = useRequestDraftStore((s) => s.patchDraft);
  switch (type) {
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
