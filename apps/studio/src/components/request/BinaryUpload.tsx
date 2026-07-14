"use client";

import * as React from "react";
import { FileUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatBytes } from "./request.types";

/**
 * Binary upload placeholder. Files are picked via a `<input type="file">`
 * and stored in component state for display only — no upload pipeline
 * is wired in this phase.
 */
export function BinaryUpload(): React.ReactElement {
  const [file, setFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const ref = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files[0] ?? null;
          setFile(f);
        }}
        className={cn(
          "flex flex-col items-center gap-3 rounded-md border-2 border-dashed px-4 py-10 text-center transition-colors",
          dragOver
            ? "border-accent bg-accent-subtle"
            : "border-border bg-bg-subtle",
        )}
      >
        <FileUp
          className={cn(
            "h-6 w-6",
            dragOver ? "text-accent" : "text-text-muted",
          )}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            {file ? file.name : "Drop a file to send as the request body"}
          </p>
          <p className="text-[11px] text-text-muted">
            Binary mode sends the raw bytes; no transformation is applied.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
          Choose file
        </Button>
        <input
          ref={ref}
          type="file"
          className="sr-only"
          onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
        />
      </div>

      {file ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-bg-base px-3 py-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-mono text-xs text-text-primary">
              {file.name}
            </span>
            <span className="text-[10px] text-text-muted">
              {file.type || "application/octet-stream"} · {formatBytes(file.size)}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      ) : null}
    </div>
  );
}
