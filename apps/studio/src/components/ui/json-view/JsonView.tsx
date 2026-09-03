"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";

import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Tokeniser                                                            */
/* ------------------------------------------------------------------ */

/**
 * Lightweight JSON syntax highlighter. Walks the source string once and
 * tags every character span as one of five kinds — key, string, number,
 * boolean / null, or punctuation. No third-party dep, no Monaco, safe
 * to render inside a server component if `value` is a literal.
 *
 * Trade-off: this is a regex-based highlighter, NOT a real parser. It
 * correctly handles the cases JSON.stringify produces (key / value /
 * punctuation) but does not try to recover from malformed input.
 * Callers that need validation should run JSON.parse first and pass
 * `value` through that path. The highlighter only colours what it's
 * given — it never throws.
 */

export type TokenKind =
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punct";

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
}

const TOKEN_RE =
  /"(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g;

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of source.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      tokens.push({ kind: "punct", text: source.slice(cursor, start) });
    }
    const text = match[0];
    let kind: TokenKind;
    if (text.startsWith('"')) {
      const next = source[start + text.length];
      kind = next === ":" ? "key" : "string";
    } else if (text === "true" || text === "false") {
      kind = "boolean";
    } else if (text === "null") {
      kind = "null";
    } else if (/^[-?\d]/.test(text)) {
      kind = "number";
    } else {
      kind = "punct";
    }
    tokens.push({ kind, text });
    cursor = start + text.length;
  }
  if (cursor < source.length) {
    tokens.push({ kind: "punct", text: source.slice(cursor) });
  }
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Inline render                                                        */
/* ------------------------------------------------------------------ */

const KIND_CLASS: Record<TokenKind, string> = {
  key: "text-[#7dd3fc] dark:text-[#7dd3fc]", // cyan-300 — JSON keys
  string: "text-[#a7f3d0] dark:text-[#a7f3d0]", // emerald-200 — values
  number: "text-[#fda4af] dark:text-[#fda4af]", // rose-300 — numbers
  boolean: "text-[#fcd34d] dark:text-[#fcd34d]", // amber-300 — booleans
  null: "text-text-muted italic", // muted italic
  punct: "text-text-secondary", // punctuation
};

/**
 * Render `source` as pre-formatted, syntax-highlighted JSON. The
 * component intentionally uses `<span>` inside a single `<pre>` so the
 * browser's native text selection still works across the whole
 * document — useful for "select this whole line and copy".
 */
export function JsonView({
  source,
  className,
  showLineNumbers = true,
}: {
  source: string;
  className?: string;
  showLineNumbers?: boolean;
}): React.ReactElement {
  const tokens = React.useMemo(() => tokenize(source), [source]);
  const lineCount = source.length === 0 ? 1 : source.split("\n").length;

  return (
    <pre
      className={cn(
        "m-0 grid min-h-full whitespace-pre font-mono text-[12px] leading-[1.65]",
        showLineNumbers ? "grid-cols-[auto_1fr] gap-x-3" : "grid-cols-1",
        className,
      )}
    >
      {showLineNumbers ? (
        <span
          aria-hidden
          className="sticky left-0 select-none border-r border-border/50 pr-3 text-right text-text-muted/60"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className="block">
              {i + 1}
            </span>
          ))}
        </span>
      ) : null}
      <code className="block">
        {tokens.map((t, i) => (
          <span key={i} className={KIND_CLASS[t.kind]}>
            {t.text}
          </span>
        ))}
      </code>
    </pre>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper with toolbar                                                 */
/* ------------------------------------------------------------------ */

/**
 * Pretty container used by both the request body preview and the
 * response example view. Renders a soft toolbar (title + copy) above
 * the syntax-highlighted body. Read-only — the editable counterpart
 * lives in `JsonEditor`.
 */
export function JsonViewPanel({
  title,
  meta,
  value,
  className,
  emptyMessage = "Empty body.",
}: {
  title?: React.ReactNode;
  meta?: React.ReactNode;
  value: unknown;
  className?: string;
  emptyMessage?: string;
}): React.ReactElement {
  const source = React.useMemo(() => stringifyForView(value), [value]);
  const [copied, setCopied] = React.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignored */
    }
  };
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-border/70 bg-bg-base",
        className,
      )}
    >
      {(title || meta) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-bg-subtle/60 px-3.5 py-1.5">
          <div className="inline-flex min-w-0 items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {title}
            {meta}
          </div>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy body"}
            className={cn(
              "inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
              copied
                ? "text-status-2xx"
                : "text-text-muted hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            {copied ? (
              <Check className="h-3 w-3" aria-hidden />
            ) : (
              <Copy className="h-3 w-3" aria-hidden />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      <div className="relative min-h-0 flex-1 overflow-auto bg-bg-base">
        {source.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-8 text-xs italic text-text-muted">
            {emptyMessage}
          </div>
        ) : (
          <div className="px-3 py-2">
            <JsonView source={source} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

export function stringifyForView(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}