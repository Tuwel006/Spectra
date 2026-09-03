"use client";

import * as React from "react";
import {
  AlertCircle,
  Braces,
  CheckCircle2,
  Copy,
  Eraser,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { tokenize } from "@/components/ui/json-view";

/* ------------------------------------------------------------------ */
/* Theme-aware syntax colours                                          */
/* ------------------------------------------------------------------ */

const KEY_CLASS = "text-sky-600 dark:text-sky-300";
const STRING_CLASS = "text-emerald-600 dark:text-emerald-300";
const NUMBER_CLASS = "text-rose-600 dark:text-rose-300";
const BOOLEAN_CLASS = "text-amber-600 dark:text-amber-300";
const NULL_CLASS = "text-text-muted italic";
const PUNCT_CLASS = "text-text-secondary";

/* ------------------------------------------------------------------ */
/* Editor layout tokens — single source of truth for the textarea +    */
/* the highlight overlay so they align pixel-for-pixel.                */
/* ------------------------------------------------------------------ */

const EDITOR_FONT_CLASS = "font-mono text-[12.5px] leading-[1.7]";
const EDITOR_PADDING_CLASS = "px-3 py-3";

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */

function EditorToolbar({
  value,
  lineCount,
  validation,
  copied,
  expanded,
  readOnly,
  onFormat,
  onCopy,
  onToggleExpand,
  onClear,
}: {
  value: string;
  lineCount: number;
  validation: Validation;
  copied: boolean;
  expanded: boolean;
  readOnly: boolean;
  onFormat: () => void;
  onCopy: () => void;
  onToggleExpand: () => void;
  onClear: () => void;
}): React.ReactElement {
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-bg-subtle/60 px-3.5 py-1.5">
      <div className="inline-flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        <Braces className="h-3 w-3" aria-hidden="true" />
        <span>JSON</span>
        <span className="font-mono text-text-muted/70 normal-case tracking-normal">
          {value.length} chars · {lineCount} lines
        </span>
        <ValidationChip validation={validation} />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip content="Format JSON (pretty-print with 2 spaces)">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Format JSON"
            onClick={onFormat}
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
            onClick={onCopy}
            disabled={value.length === 0}
            className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-status-2xx" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content={expanded ? "Restore size" : "Expand"}>
          <Button
            variant="ghost"
            size="icon"
            aria-label={expanded ? "Restore editor size" : "Expand editor"}
            onClick={onToggleExpand}
            className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            {expanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </Tooltip>
        <Tooltip content="Clear">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear body"
            onClick={onClear}
            disabled={readOnly || value.length === 0}
            className="h-7 w-7 text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            <Eraser className="h-3.5 w-3.5" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

function ValidationChip({ validation }: { validation: Validation }): React.ReactElement | null {
  if (validation.kind === "ok") {
    return (
      <span className="inline-flex items-center gap-1 text-status-2xx">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Valid
      </span>
    );
  }
  if (validation.kind === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 truncate text-method-delete"
        title={validation.message}
      >
        <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
        {validation.message}
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Line gutter                                                         */
/* ------------------------------------------------------------------ */

function LineGutter({
  count,
  refEl,
}: {
  count: number;
  refEl: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const numbers = React.useMemo(
    () => Array.from({ length: count }, (_, i) => i + 1),
    [count],
  );
  return (
    <div
      ref={refEl}
      aria-hidden
      className={cn(
        "select-none overflow-hidden border-r border-border/60 bg-bg-subtle/40 text-right text-text-muted/70",
        EDITOR_FONT_CLASS,
      )}
    >
      <div className={EDITOR_PADDING_CLASS}>
        {numbers.map((n) => (
          <div key={n} className="block">
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Highlight overlay                                                    */
/* ------------------------------------------------------------------ */

function HighlightOverlay({
  value,
  tokens,
  refEl,
}: {
  value: string;
  tokens: ReturnType<typeof tokenize>;
  refEl: React.RefObject<HTMLPreElement | null>;
}): React.ReactElement {
  return (
    <pre
      ref={refEl}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre",
        EDITOR_FONT_CLASS,
        EDITOR_PADDING_CLASS,
      )}
    >
      {value.length === 0 ? (
        <span className="text-text-muted/60 italic">
          {`{\n  "type": "object",\n  ...\n}`}
        </span>
      ) : (
        <>
          {tokens.map((t, i) => (
            <span key={i} className={classForKind(t.kind)}>
              {t.text}
            </span>
          ))}
          {/* Trailing zero-width space so the caret can sit on a
              fresh line at the very end of the document. */}
          <span>{"\u200B"}</span>
        </>
      )}
    </pre>
  );
}

function classForKind(kind: ReturnType<typeof tokenize>[number]["kind"]): string {
  switch (kind) {
    case "key":
      return KEY_CLASS;
    case "string":
      return STRING_CLASS;
    case "number":
      return NUMBER_CLASS;
    case "boolean":
      return BOOLEAN_CLASS;
    case "null":
      return NULL_CLASS;
    case "punct":
      return PUNCT_CLASS;
  }
}

/* ------------------------------------------------------------------ */
/* Public editor                                                       */
/* ------------------------------------------------------------------ */

type Validation =
  | { kind: "idle" }
  | { kind: "ok"; value: unknown }
  | { kind: "error"; message: string };

/**
 * Custom JSON editor.
 *
 * <p>
 *   A textarea (transparent text, visible caret) sits on top of a
 *   syntax-highlighted `<pre>` that uses the shared {@link tokenize}
 *   helper from `@/components/ui/json-view`. The two layers share
 *   identical padding / font / line-height so the highlighted glyphs
 *   line up with the caret. Scrolling on the textarea is mirrored to
 *   the highlight layer and the line-number gutter via `onScroll`.
 * </p>
 *
 * <p>
 *   Unlike the previous Monaco-based editor this one renders
 *   server-side and follows the active light/dark theme, so it never
 *   produces the "black bar" you get from Monaco when the host theme
 *   mismatches its `vs-dark` preset.
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
  const validation: Validation = React.useMemo(() => validateJson(value), [value]);
  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const highlightRef = React.useRef<HTMLPreElement | null>(null);
  const gutterRef = React.useRef<HTMLDivElement | null>(null);

  const tokens = React.useMemo(() => tokenize(value), [value]);
  const lineCount = React.useMemo(
    () => (value.length === 0 ? 1 : value.split("\n").length),
    [value],
  );

  const syncScroll = React.useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  React.useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.scrollTop = 0;
    syncScroll();
  }, [value, syncScroll]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignored — clipboard may be unavailable in some sandboxes */
    }
  };

  const format = () => {
    if (validation.kind === "ok") {
      onChange(JSON.stringify(validation.value, null, 2));
    }
  };

  const clear = () => onChange("");

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const ta = event.currentTarget;

    // Tab → insert two spaces instead of jumping focus.
    if (event.key === "Tab") {
      event.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
      return;
    }

    // Enter → auto-indent to match the previous line, plus one extra
    // level when the line ends with `{` or `[`.
    if (event.key === "Enter") {
      event.preventDefault();
      const start = ta.selectionStart;
      const before = value.slice(0, start);
      const after = value.slice(start);
      const lineStart = before.lastIndexOf("\n") + 1;
      const indentMatch = /^[ \t]*/.exec(before.slice(lineStart));
      const indent = indentMatch ? indentMatch[0] : "";
      const lastChar = before.trimEnd().slice(-1);
      const extra = lastChar === "{" || lastChar === "[" ? "  " : "";
      const insertion = `\n${indent}${extra}`;
      const next = `${before}${insertion}${after}`;
      onChange(next);
      const caretAt = start + insertion.length;
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = caretAt;
      });
    }
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border/70 bg-bg-base",
        expanded && "fixed inset-4 z-50 shadow-2xl",
      )}
    >
      <EditorToolbar
        value={value}
        lineCount={lineCount}
        validation={validation}
        copied={copied}
        expanded={expanded}
        readOnly={readOnly}
        onFormat={format}
        onCopy={copy}
        onToggleExpand={() => setExpanded((v) => !v)}
        onClear={clear}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[auto_1fr] overflow-hidden bg-bg-base">
        <LineGutter count={lineCount} refEl={gutterRef} />

        <div className="relative min-h-0 overflow-hidden">
          <HighlightOverlay value={value} tokens={tokens} refEl={highlightRef} />

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            onScroll={syncScroll}
            disabled={readOnly}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-label="JSON request body"
            placeholder="Paste or write JSON here…"
            className={cn(
              "absolute inset-0 m-0 h-full w-full resize-none overflow-auto border-0 outline-none",
              "whitespace-pre",
              EDITOR_FONT_CLASS,
              EDITOR_PADDING_CLASS,
              "bg-transparent text-transparent caret-text-primary selection:bg-accent-subtle",
              "focus:outline-none focus:ring-0",
            )}
            style={{
              tabSize: 2,
              MozTabSize: 2,
              WebkitTextFillColor: "transparent",
            }}
          />
        </div>
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