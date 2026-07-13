"use client";

import * as React from "react";
import { Copy, Star, Share2, Clock, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { MethodBadge } from "@/components/ui/MethodBadge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { EndpointEntry } from "@/types";

interface EndpointHeaderProps {
  endpoint: EndpointEntry;
}

/**
 * The prominent header shown above the endpoint workspace.
 * Contains: method badge, URL, copy, favourite, share, and run controls.
 * The "Run" button is presentational — no backend calls.
 */
export function EndpointHeader({ endpoint }: EndpointHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { operation } = endpoint;

  return (
    <div className="flex flex-col gap-2 border-b border-[--color-border] px-5 py-3 bg-[--color-bg-base]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[--color-text-muted]">
        <span>APIs</span>
        <span>/</span>
        {(operation.extensions?.["x-tags"] as string[] | undefined)?.[0] && (
          <>
            <span>{(operation.extensions?.["x-tags"] as string[])[0]}</span>
            <span>/</span>
          </>
        )}
        <span className="text-[--color-text-secondary]">
          {operation.name ?? operation.operationId ?? endpoint.url}
        </span>
      </nav>

      {/* Method + URL bar */}
      <div className="flex items-center gap-3">
        <MethodBadge method={endpoint.method} className="text-xs px-2.5 py-1 rounded-md" />

        <div
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg border border-[--color-border]",
            "bg-[--color-bg-subtle] px-4 py-2 font-mono text-sm text-[--color-text-primary]",
            "min-w-0"
          )}
        >
          <span className="text-[--color-text-muted] text-xs shrink-0">
            http://localhost:3000
          </span>
          <span className="flex-1 truncate">{endpoint.url}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content={copied ? "Copied!" : "Copy URL"} side="bottom">
            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy URL">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </Tooltip>

          <Tooltip content="Save to favourites" side="bottom">
            <Button variant="ghost" size="icon" aria-label="Favourite">
              <Star className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Request history" side="bottom">
            <Button variant="ghost" size="icon" aria-label="History">
              <Clock className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip content="Share endpoint" side="bottom">
            <Button variant="ghost" size="icon" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </Tooltip>

          {/* Run button (presentational) */}
          <Button variant="default" size="sm" className="ml-2 px-4" aria-label="Send request">
            Send
          </Button>
        </div>
      </div>

      {/* Summary */}
      {operation.summary && (
        <p className="text-sm font-medium text-[--color-text-secondary]">
          {operation.summary}
        </p>
      )}
    </div>
  );
}
