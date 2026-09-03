"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { AlertCircle, CheckCircle2, Copy, Eraser, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { JsonViewPanel } from "@/components/ui/json-view";

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
 *   and clutter the build. SSR fallback is a syntax-highlighted
 *   preview via the shared `JsonViewPanel` so the layout stays
 *   stable until Monaco loads.
 * </p>
 *
 * <p>The toolbar mirrors the conventions used by other request-body
 * editors in the studio: a left-aligned validity chip, a right-aligned
 * action group with `Format · Copy · Clear`. All three actions share
 * the same small button style.</p>
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

  const parsed = validation.kind === "ok" ? validation.value : undefined;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-md border border-border/70 bg-bg-base",
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-bg-subtle/60 px-3.5 py-1.5">
        <div className="inline-flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
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
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip content="Format JSON">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Format JSON"
              onClick={() => {
                if (validation.kind === "ok")
                  onChange(JSON.stringify(validation.value, null, 2));
              }}
              disabled={validation.kind !== "ok"}
              className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
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
              className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
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
              className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
            >
              <Eraser className="h-3.5 w-3.5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-bg-base">
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
              fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
              fontLigatures: true,
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: "gutter",
              padding: { top: 14, bottom: 14 },
              bracketPairColorization: { enabled: true },
              guides: { indentation: false, bracketPairs: false },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              roundedSelection: false,
              renderValidationDecorations: "on",
              lineDecorationsWidth: 8,
              lineNumbersMinChars: 3,
              tabFocusMode: false,
            }}
          />
        ) : (
          <div className="h-full">
            <JsonViewPanel value={parsed ?? ""} className="h-full border-0" />
          </div>
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