"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle2, Copy, Eraser, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false },
);

/**
 * JSON editor powered by Monaco.
 *
 * <p>
 *   The editor itself is loaded via `next/dynamic` (ssr: false) so the
 *   Monaco worker doesn't try to boot inside the Next.js server bundle
 *   and clutter the build. SSR fallback is a plain `<textarea>` so the
 *   layout stays stable until Monaco loads.
 * </p>
 */
export function JsonEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
}): React.ReactElement {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const validation = React.useMemo(() => validateJson(value), [value]);
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard access can be blocked in some envs
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-bg-muted px-3 py-1.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <span>JSON</span>
          {validation.kind === "ok" ? (
            <span className="inline-flex items-center gap-1 text-status-2xx">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Valid
            </span>
          ) : null}
          {validation.kind === "error" ? (
            <span className="inline-flex items-center gap-1 text-method-delete">
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {validation.message}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Format JSON">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Format JSON"
              onClick={() => {
                if (validation.kind === "ok") onChange(JSON.stringify(validation.value, null, 2));
              }}
              disabled={validation.kind !== "ok"}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content={copied ? "Copied" : "Copy"}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy JSON"
              onClick={copy}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
          <Tooltip content="Clear">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear body"
              onClick={() => onChange("")}
              disabled={readOnly || value.length === 0}
            >
              <Eraser className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className={cn("flex-1", mounted ? "" : "p-2")}>
        {mounted ? (
          <MonacoEditor
            height="100%"
            defaultLanguage="json"
            theme="vs-dark"
            value={value}
            onChange={(v) => onChange(v ?? "")}
            options={{
              readOnly,
              minimap: { enabled: false },
              lineNumbers: "on",
              wordWrap: "on",
              fontSize: 12,
              fontFamily: "var(--font-geist-mono), monospace",
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: "gutter",
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            disabled={readOnly}
            spellCheck={false}
            aria-label="JSON body"
            className={cn(
              "h-full w-full resize-none rounded-md bg-[#1e1e1e] p-3 font-mono text-xs text-text-primary",
              "focus:outline-none",
            )}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Parse `value` as JSON. Returns a discriminated union so callers can
 * distinguish "empty / no validation yet" from "valid" or "error".
 */
export function validateJson(
  value: string,
):
  | { kind: "idle" }
  | { kind: "ok"; value: unknown }
  | { kind: "error"; message: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) return { kind: "idle" };
  try {
    return { kind: "ok", value: JSON.parse(trimmed) };
  } catch (error) {
    return {
      kind: "error",
      message: (error as Error).message.replace(/^JSON\.parse:?\s*/i, ""),
    };
  }
}
