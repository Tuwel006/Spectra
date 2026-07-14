"use client";

import * as React from "react";
import { FileUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { formatBytes, type MultipartField } from "./request.types";
import { useRequestDraftStore } from "./request.store";

/**
 * Multipart form-data editor. Supports text fields, file fields, and a
 * drag-and-drop placeholder so the spec's drop area exists ready for
 * the real upload pipeline in a later phase.
 */
export function MultipartEditor({
  endpointId,
}: {
  endpointId: string;
}): React.ReactElement {
  const fields = useRequestDraftStore(
    (s) => s.drafts[endpointId]?.multipartFields ?? [],
  );
  const patch = useRequestDraftStore((s) => s.patchDraft);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const update = (id: string, partial: Partial<MultipartField>) => {
    patch(
      endpointId,
      "multipartFields",
      fields.map((f) => (f.id === id ? { ...f, ...partial } : f)),
    );
  };

  const remove = (id: string) => {
    patch(
      endpointId,
      "multipartFields",
      fields.filter((f) => f.id !== id),
    );
  };

  const addText = () => {
    const id = `mpf-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "multipartFields", [
      ...fields,
      { id, key: "", value: "", kind: "text", enabled: true },
    ]);
  };

  const addFileRow = () => {
    const id = `mpf-${Math.random().toString(36).slice(2, 8)}`;
    patch(endpointId, "multipartFields", [
      ...fields,
      { id, key: "", value: "", kind: "file", enabled: true },
    ]);
  };

  const handleFile = (file: File | null, targetFieldId?: string) => {
    if (!file) return;
    const id = targetFieldId ?? `mpf-${Math.random().toString(36).slice(2, 8)}`;
    const existing = fields.find((f) => f.id === id);
    const next: MultipartField = {
      id,
      key: existing?.key ?? "",
      value: existing?.value ?? "",
      kind: "file",
      enabled: true,
      fileName: file.name,
      fileSize: file.size,
    };
    const nextFields = existing
      ? fields.map((f) => (f.id === id ? next : f))
      : [...fields, next];
    patch(endpointId, "multipartFields", nextFields);
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0] ?? null;
          handleFile(file);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-md border-2 border-dashed px-4 py-6 text-center transition-colors",
          dragOver
            ? "border-accent bg-accent-subtle"
            : "border-border bg-bg-subtle",
        )}
      >
        <FileUp
          className={cn(
            "h-5 w-5",
            dragOver ? "text-accent" : "text-text-muted",
          )}
          aria-hidden="true"
        />
        <p className="text-xs font-medium text-text-secondary">
          Drop files here or pick from disk
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Choose files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = e.currentTarget.files;
            if (!files) return;
            for (let i = 0; i < files.length; i += 1) {
              handleFile(files.item(i));
            }
            e.currentTarget.value = "";
          }}
        />
        <p className="text-[10px] text-text-muted">
          Upload is a no-op — files are kept in memory only for the
          preview.
        </p>
      </div>

      {/* Rows */}
      {fields.length === 0 ? (
        <p className="px-1 py-2 text-[11px] italic text-text-muted">
          No fields yet. Add a text field, a file field, or drop a file
          above.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {fields.map((field) => (
            <div
              key={field.id}
              className={cn(
                "grid grid-cols-[auto_1.2fr_2fr_auto] items-center gap-2 rounded-md border border-border bg-bg-base p-2",
                !field.enabled && "opacity-60",
              )}
            >
              <Checkbox
                checked={field.enabled}
                onChange={(e) =>
                  update(field.id, { enabled: e.currentTarget.checked })
                }
                aria-label={`Enable ${field.key || "field"}`}
              />
              <Input
                size="sm"
                value={field.key}
                onChange={(e) =>
                  update(field.id, { key: e.currentTarget.value })
                }
                placeholder="field-key"
              />
              {field.kind === "text" ? (
                <Input
                  size="sm"
                  value={field.value}
                  onChange={(e) =>
                    update(field.id, { value: e.currentTarget.value })
                  }
                  placeholder="text value"
                />
              ) : (
                <FilePreview field={field} onChangeFile={handleFile} />
              )}
              <div className="flex items-center gap-1">
                <Select
                  size="sm"
                  value={field.kind}
                  onChange={(e) =>
                    update(field.id, { kind: e.currentTarget.value as "text" | "file" })
                  }
                  aria-label="Field kind"
                  options={[
                    { value: "text", label: "Text" },
                    { value: "file", label: "File" },
                  ]}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove field"
                  onClick={() => remove(field.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={addText}>
          <Plus className="h-3.5 w-3.5" />
          Text field
        </Button>
        <Button variant="outline" size="sm" onClick={addFileRow}>
          <Plus className="h-3.5 w-3.5" />
          File field
        </Button>
      </div>
    </div>
  );
}

function FilePreview({
  field,
  onChangeFile,
}: {
  field: MultipartField;
  onChangeFile: (file: File | null, id?: string) => void;
}): React.ReactElement {
  const ref = React.useRef<HTMLInputElement | null>(null);
  if (!field.fileName) {
    return (
      <div className="flex h-7 items-center gap-2 rounded-md border border-dashed border-border bg-bg-subtle px-2 text-[11px] text-text-muted">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="text-accent hover:underline"
        >
          Choose file
        </button>
        <input
          ref={ref}
          type="file"
          className="sr-only"
          onChange={(e) =>
            onChangeFile(e.currentTarget.files?.[0] ?? null, field.id)
          }
        />
      </div>
    );
  }
  return (
    <div className="flex h-7 items-center justify-between gap-2 rounded-md border border-border bg-bg-base px-2 text-[11px] text-text-secondary">
      <span className="truncate font-mono">{field.fileName}</span>
      <span className="shrink-0 text-text-muted">
        {formatBytes(field.fileSize ?? 0)}
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Remove file"
        onClick={() => onChangeFile(null, field.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
