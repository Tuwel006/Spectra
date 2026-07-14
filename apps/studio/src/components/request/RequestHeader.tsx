"use client";

import * as React from "react";
import { Link2, Play, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

import { EnvironmentSelector } from "./EnvironmentSelector";
import type { HttpMethod } from "@spectra/core";

const METHODS: readonly HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
];

const METHOD_OPTIONS = METHODS.map((m) => ({ value: m, label: m }));

/**
 * Top bar of the request editor — method dropdown, URL field,
 * environment selector, and a disabled "Send" button. The Send button
 * stays disabled until the response viewer lands (out of scope for
 * Phase 5).
 */
export function RequestHeader({
  endpointId,
  method,
  url,
  hasBody,
  onMethodChange,
  onUrlChange,
}: {
  endpointId: string;
  method: HttpMethod;
  url: string;
  hasBody: boolean;
  onMethodChange: (next: HttpMethod) => void;
  onUrlChange: (next: string) => void;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch gap-2 border-b border-border bg-bg-subtle p-3",
      )}
    >
      <Select
        size="md"
        className="w-32 font-semibold"
        value={method}
        onChange={(e) => onMethodChange(e.currentTarget.value as HttpMethod)}
        aria-label="HTTP method"
        leadingIcon={<MethodBadge method={method as never} size="xs" />}
        options={METHOD_OPTIONS}
      />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Input
          size="md"
          value={url}
          onChange={(e) => onUrlChange(e.currentTarget.value)}
          placeholder="https://api.example.com/path"
          leadingIcon={<Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
          aria-label="Request URL"
          className="font-mono"
        />
      </div>

      <EnvironmentSelector />

      <Tooltip content="Send request — response viewer arrives in a later phase.">
        <Button
          variant="primary"
          size="md"
          disabled
          leadingIcon={<Send className="h-3.5 w-3.5" />}
          aria-label="Send request"
          data-endpoint-id={endpointId}
        >
          Send
        </Button>
      </Tooltip>

      {hasBody ? (
        <span className="ml-2 hidden items-center gap-1 self-center text-[10px] uppercase tracking-wider text-text-muted md:inline-flex">
          <Play className="h-3 w-3" aria-hidden="true" />
          body attached
        </span>
      ) : null}
    </div>
  );
}