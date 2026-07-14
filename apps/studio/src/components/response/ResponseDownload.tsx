"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

/**
 * Download-as-file button. Creates an in-memory blob and clicks a
 * hidden `<a download>` link to save the response payload with a
 * sensible file name.
 */
export function ResponseDownload({
  value,
  filename,
  contentType = "application/octet-stream",
  disabled,
}: {
  value: string;
  filename: string;
  contentType?: string;
  disabled?: boolean;
}): React.ReactElement {
  const handleDownload = React.useCallback(() => {
    if (value.length === 0) return;
    try {
      const blob = new Blob([value], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // SSR or restricted context — silently fail.
    }
  }, [value, filename, contentType]);

  return (
    <Tooltip content="Download as file">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Download response"
        onClick={handleDownload}
        disabled={disabled || value.length === 0}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </Tooltip>
  );
}