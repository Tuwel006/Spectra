"use client";

import * as React from "react";
import { Copy, Eraser } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/**
 * Plain text editor for raw bodies. Line-numbered monospace area with
 * optional read-only mode and the same toolbar affordances as
 * {@link JsonEditor} (without the JSON validation).
 */
export function TextEditor({
  value,
  onChange,
  readOnly = false,
  language = "text",
}: {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  language?: "text" | "xml" | "graphql";
}): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-bg-muted px-3 py-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {language.toUpperCase()}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={copied ? "Copied" : "Copy"}>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Copy ${language}`}
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
      <div className="flex-1">
        <textarea
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          disabled={readOnly}
          spellCheck={false}
          aria-label={`${language} body`}
          className={cn(
            "h-full w-full resize-none p-3 font-mono text-xs text-text-primary",
            "bg-bg-base focus:outline-none",
          )}
        />
      </div>
    </div>
  );
}
