"use client";

import { Copy, History, Play, Share2, Star } from "lucide-react";

import { Badge, MethodBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { HttpMethod } from "@spectra/core";

interface EndpointHeaderProps {
  readonly method: HttpMethod;
  readonly url: string;
  readonly title: string;
  readonly description?: string;
  readonly tags: readonly string[];
  readonly security: string | null;
  readonly favorite: boolean;
  readonly onCopy: () => void;
  readonly onShare: () => void;
  readonly onRun: () => void;
  readonly onHistory: () => void;
  readonly onToggleFavorite: () => void;
}

/**
 * Header strip rendered at the top of the endpoint viewer.
 *
 * Shows method + URL + title, action buttons (copy, run, share, history,
 * favourite) and a description preview.
 */
export function EndpointHeader({
  method,
  url,
  title,
  description,
  tags,
  security,
  favorite,
  onCopy,
  onShare,
  onRun,
  onHistory,
  onToggleFavorite,
}: EndpointHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-border bg-bg-base p-4">
      <div className="flex flex-wrap items-center gap-2">
        <MethodBadge method={method} size="md" />
        <h1 className="font-mono text-base font-semibold text-text-primary">{url}</h1>
        <Badge variant="subtle">{title}</Badge>
        {tags.map((tag) => (
          <Badge key={tag} variant="accent">
            {tag}
          </Badge>
        ))}
        {security ? (
          <Badge variant="default" className="border-status-3xx/40 text-status-3xx">
            {security}
          </Badge>
        ) : null}
      </div>

      {description ? (
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      ) : null}

      <div className="flex items-center gap-1.5">
        <Tooltip content="Copy as cURL">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="size-3.5" /> Copy
          </Button>
        </Tooltip>
        <Tooltip content="Share">
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share2 className="size-3.5" /> Share
          </Button>
        </Tooltip>
        <Tooltip content="History">
          <Button size="sm" variant="outline" onClick={onHistory}>
            <History className="size-3.5" /> History
          </Button>
        </Tooltip>
        <Tooltip content={favorite ? "Remove from favorites" : "Add to favorites"}>
          <Button
            size="sm"
            variant="outline"
            aria-pressed={favorite}
            onClick={onToggleFavorite}
          >
            <Star
              className={
                favorite ? "size-3.5 fill-status-3xx text-status-3xx" : "size-3.5"
              }
            />
            Favorite
          </Button>
        </Tooltip>

        <div className="ml-auto">
          <Tooltip content="Run (mock)">
            <Button size="sm" variant="primary" onClick={onRun}>
              <Play className="size-3.5" /> Run
            </Button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}