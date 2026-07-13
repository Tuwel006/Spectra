"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, FormInput, Upload } from "lucide-react";

import { useTabsStore } from "@/store/tabs-store";
import { Badge, Segmented } from "@/components/ui";
import type { BodyType } from "@/store/tabs-store";
import type { FlatOperation } from "@/lib/tree";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false, loading: () => <EditorSkeleton /> },
);

interface BodyPanelProps {
  readonly tabId: string;
  readonly operation: FlatOperation;
}

const BODY_TYPES: ReadonlyArray<{
  id: BodyType;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "none", label: "None", icon: FileText },
  { id: "json", label: "JSON", icon: FileText },
  { id: "form-data", label: "Multipart", icon: Upload },
  { id: "url-encoded", label: "URL-encoded", icon: FormInput },
  { id: "raw", label: "Raw", icon: FileText },
];

/**
 * Body sub-tab — body-type selector plus a Monaco editor for the payload.
 *
 * Switching between body types swaps the editor language. The body text
 * is persisted on the tab so users can navigate away and come back.
 */
export function BodyPanel({ tabId, operation }: BodyPanelProps) {
  const tab = useTabsStore((state) =>
    state.tabs.find((current) => current.id === tabId),
  );
  const updateTab = useTabsStore((state) => state.updateTab);
  const [local, setLocal] = useState(tab?.requestBody ?? "");

  useEffect(() => {
    setLocal(tab?.requestBody ?? "");
  }, [tab?.id, tab?.requestBody]);

  if (!tab) return null;

  const supportsBody =
    operation.method === "POST" ||
    operation.method === "PUT" ||
    operation.method === "PATCH" ||
    operation.method === "DELETE";

  if (!supportsBody) {
    return (
      <div className="rounded-md border border-dashed border-border bg-bg-subtle px-3 py-6 text-center text-xs text-text-muted">
        {operation.method} requests do not include a body.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Request body
        </h2>
        {operation.request.body ? (
          <Badge variant="accent">
            {operation.request.body.required ? "required" : "optional"}
          </Badge>
        ) : null}
      </div>
      <Segmented
        value={tab.bodyType}
        onChange={(value) => updateTab(tab.id, { bodyType: value })}
        options={BODY_TYPES.map(({ id, label }) => ({ id, label }))}
        size="sm"
      />

      <div className="overflow-hidden rounded-md border border-border">
        <MonacoEditor
          height="320px"
          language={monacoLanguage(tab.bodyType)}
          value={local}
          theme={monacoTheme()}
          onChange={(value) => {
            const next = value ?? "";
            setLocal(next);
            updateTab(tab.id, { requestBody: next });
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 12,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>
    </div>
  );
}

function monacoLanguage(bodyType: BodyType): string {
  switch (bodyType) {
    case "json":
      return "json";
    case "form-data":
    case "url-encoded":
      return "http";
    case "raw":
      return "plaintext";
    case "binary":
      return "plaintext";
    default:
      return "plaintext";
  }
}

function monacoTheme(): "vs" | "vs-dark" {
  if (typeof document === "undefined") return "vs-dark";
  return document.documentElement.classList.contains("dark") ? "vs-dark" : "vs";
}

function EditorSkeleton() {
  return (
    <div className="flex h-[320px] items-center justify-center bg-bg-muted text-xs text-text-muted">
      Loading editor…
    </div>
  );
}