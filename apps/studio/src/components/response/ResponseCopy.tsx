"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Copy-to-clipboard button used in the response toolbar. Shows a brief
 * "Copied" confirmation toast after a successful copy.
 */
export function ResponseCopy({
  value,
  disabled,
  label = "Copy response",
}: {
  value: string;
  disabled?: boolean;
  label?: string;
}): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard may be blocked in some contexts — silent failure.
    }
  }, [value]);

  return (
    <Tooltip content={copied ? "Copied" : label}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={handleCopy}
        disabled={disabled || value.length === 0}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-status-2xx" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </Tooltip>
  );
}