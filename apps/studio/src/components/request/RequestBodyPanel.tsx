"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";
import type { RequestBody } from "@spectra/core";
import { InnerTabBar } from "@/components/tabs/InnerTabBar";

// Monaco is heavy — load it only when the body tab is active
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-xs text-[--color-text-muted]">
        Loading editor…
      </div>
    ),
  }
);

const BODY_FORMAT_TABS = [
  { id: "none",       label: "None" },
  { id: "json",       label: "JSON" },
  { id: "form-data",  label: "Form Data" },
  { id: "urlencoded", label: "x-www-form-urlencoded" },
  { id: "raw",        label: "Raw" },
  { id: "binary",     label: "Binary" },
] as const;

type BodyFormat = (typeof BODY_FORMAT_TABS)[number]["id"];

interface RequestBodyPanelProps {
  body?: RequestBody;
  className?: string;
}

/**
 * Request Body panel with format switcher and Monaco JSON editor.
 * Detects the primary content type from the RequestBody and pre-selects it.
 */
export function RequestBodyPanel({ body, className }: RequestBodyPanelProps) {
  const hasJson = body?.content["application/json"];
  const hasFormData = body?.content["multipart/form-data"];

  const defaultFormat: BodyFormat = hasJson
    ? "json"
    : hasFormData
    ? "form-data"
    : body
    ? "raw"
    : "none";

  const [format, setFormat] = React.useState<BodyFormat>(defaultFormat);

  // Generate a starter JSON example from the schema id
  const exampleJson = hasJson
    ? JSON.stringify({ "// schema": body?.content["application/json"]?.schema?.id }, null, 2)
    : "{}";

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Format switcher */}
      <div className="flex items-center gap-1 border-b border-[--color-border] px-4 py-1.5 flex-wrap">
        {BODY_FORMAT_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFormat(tab.id)}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-medium transition-colors",
              format === tab.id
                ? "bg-[--color-accent-subtle] text-[--color-accent]"
                : "text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-bg-muted]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {format === "none" && (
          <EmptyBodyState />
        )}
        {format === "json" && (
          <MonacoEditor
            height="100%"
            defaultLanguage="json"
            defaultValue={exampleJson}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              folding: true,
              formatOnPaste: true,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              fontFamily: "var(--font-mono)",
            }}
          />
        )}
        {format === "raw" && (
          <MonacoEditor
            height="100%"
            defaultLanguage="text"
            defaultValue=""
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
            }}
          />
        )}
        {(format === "form-data" || format === "urlencoded") && (
          <FormDataPlaceholder format={format} />
        )}
        {format === "binary" && (
          <BinaryPlaceholder />
        )}
      </div>
    </div>
  );
}

function EmptyBodyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-8">
      <p className="text-sm text-[--color-text-muted]">
        This request does not have a body.
      </p>
      <p className="text-xs text-[--color-text-disabled]">
        Select a body format above to add one.
      </p>
    </div>
  );
}

function FormDataPlaceholder({ format }: { format: string }) {
  return (
    <div className="p-4">
      <p className="text-xs text-[--color-text-muted] mb-3">
        {format === "form-data" ? "multipart/form-data" : "application/x-www-form-urlencoded"}
      </p>
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center">
        <p className="text-sm text-[--color-text-disabled]">
          Form field builder coming soon.
        </p>
      </div>
    </div>
  );
}

function BinaryPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="rounded-lg border border-dashed border-[--color-border] px-12 py-8 text-center">
        <p className="text-sm text-[--color-text-muted]">Drop a file here or click to browse</p>
        <p className="text-xs text-[--color-text-disabled] mt-1">Binary file upload</p>
      </div>
    </div>
  );
}
