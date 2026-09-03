"use client";

import * as React from "react";
import { Link2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { MethodBadge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { Operation, HttpMethod } from "@spectra/core";

import { EnvironmentSelector } from "./EnvironmentSelector";
import { syncUrlToDraft } from "@/components/workspace/urlDraftSync";
import { useEndpointUrl } from "@/components/workspace/useEndpointUrl";

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
 *
 * <p>The URL input is wired to the same source of truth as the big
 * header URL bar at the top of the workspace — both surfaces read
 * from `useEndpointUrl` and write through `syncUrlToDraft`, so a
 * value typed here immediately populates the path-param / query-param
 * inputs in the tables below, and a value typed into the table inputs
 * immediately flows back into this URL bar.</p>
 */
export function RequestHeader({
  operation,
  method,
  onMethodChange,
}: {
  endpointId: string;
  operation: Operation;
  method: HttpMethod;
  onMethodChange: (next: HttpMethod) => void;
}): React.ReactElement {
  const { url, path, serverUrl } = useEndpointUrl(operation);

  // Local mirror so typing doesn't fight the controlled `url` prop
  // while the input is focused. The mirror is kept in sync with the
  // derived URL via the React-recommended derived-state-from-props
  // pattern (set during render, not in an effect).
  const [draftUrl, setDraftUrl] = React.useState(url);
  const [editing, setEditing] = React.useState(false);
  const [prevUrl, setPrevUrl] = React.useState(url);
  if (prevUrl !== url) {
    setPrevUrl(url);
    if (!editing) setDraftUrl(url);
  }

  const handleChange = React.useCallback(
    (next: string) => {
      setDraftUrl(next);
      syncUrlToDraft(next, serverUrl, path, operation.id);
    },
    [serverUrl, path, operation.id],
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-stretch gap-2 border-b border-border bg-bg-subtle px-3 py-2.5",
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
          value={draftUrl}
          onChange={(e) => handleChange(e.currentTarget.value)}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
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
          data-endpoint-id={operation.id}
        >
          Send
        </Button>
      </Tooltip>
    </div>
  );
}