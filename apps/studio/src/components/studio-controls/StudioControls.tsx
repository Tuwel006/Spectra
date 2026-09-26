"use client";

import * as React from "react";
import { Check, Download, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import { useDocumentation } from "@/lib/documentationStore";

/**
 * Floating action panel for the docs studio.
 *
 * <p>Renders three buttons + a status pill:</p>
 *
 * <pre>
 *  ┌─ DOCS ──────────────────────┐
 *  │ ⏳ Loading…      💾 Save   ↻   │
 *  │ ✓ Saved 2 min ago ⤓ Export  │
 *  └─────────────────────────────┘
 * </pre>
 *
 * <p>The status pill tells the user where their current view came
 * from. The three buttons:</p>
 *
 * <ul>
 *   <li><strong>Save</strong> — writes the in-memory edits to
 *       localStorage (see {@link useDocumentation.save}).</li>
 *   <li><strong>Reset</strong> — drops the localStorage cache and
 *       re-fetches + decodes document.bin from the network.</li>
 *   <li><strong>Export</strong> — downloads the active doc as a
 *       pretty-printed JSON file (useful for sharing / CI
 *       snapshots).</li>
 * </ul>
 *
 * <p><strong>Invariant:</strong> this component never writes to
 * <code>document.bin</code> itself. The bin file only changes when
 * the user re-runs <code>spectra generate</code> on the server.
 * Saving here just persists the current view into localStorage so
 * the next page load doesn't have to re-decode.</p>
 */
export function StudioControls(): React.ReactElement | null {
    const {
        status,
        fromCache,
        save,
        reset,
        exportJson,
    } = useDocumentation();

    const [exportUrl, setExportUrl] = React.useState<string | undefined>();

    React.useEffect(() => {
        if (!exportUrl) return;
        return () => {
            URL.revokeObjectURL(exportUrl);
        };
    }, [exportUrl]);

    const handleExport = React.useCallback(() => {
        const json = exportJson();
        if (!json) return;
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        setExportUrl(url);
        const a = document.createElement("a");
        a.href = url;
        a.download = "documentation.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [exportJson]);

    if (typeof window === "undefined") return null;
    if (status === "loading") {
        return (
            <div className="fixed bottom-4 right-4 z-50 rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-secondary shadow-md">
                <span className="font-mono">⏳ Loading document.bin…</span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-border bg-bg-base px-3 py-2 text-xs shadow-md">
            <StatusPill status={status} fromCache={fromCache} />

            <Tooltip content="Persist current view to localStorage">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={save}
                    className={cn(
                        "h-7 gap-1.5 text-text-secondary",
                        status === "ready" && "text-status-2xx hover:text-status-2xx",
                    )}
                    aria-label="Save documentation view to localStorage"
                >
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    <span>Save</span>
                </Button>
            </Tooltip>

            <Tooltip content="Discard local cache and re-fetch document.bin from the server">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        void reset();
                    }}
                    className="h-7 gap-1.5 text-text-secondary"
                    aria-label="Reset local cache"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    <span>Reset</span>
                </Button>
            </Tooltip>

            <Tooltip content="Download active document as JSON">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExport}
                    className="h-7 gap-1.5 text-text-secondary"
                    aria-label="Export document as JSON"
                >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    <span>Export</span>
                </Button>
            </Tooltip>

            {exportUrl && (
                <span className="ml-1 inline-flex items-center gap-1 text-status-2xx">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    <span>Downloaded</span>
                </span>
            )}
        </div>
    );
}

function StatusPill({
    status,
    fromCache,
}: {
    status: "ready" | "error";
    fromCache: boolean;
}): React.ReactElement {
    if (status === "error") {
        return (
            <span className="inline-flex items-center gap-1 font-mono text-method-delete">
                ✗ error
            </span>
        );
    }
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 font-mono",
                fromCache
                    ? "text-text-secondary"
                    : "text-status-2xx",
            )}
            title={
                fromCache
                    ? "Loaded from localStorage cache"
                    : "Fetched fresh from document.bin"
            }
        >
            <Check className="h-3.5 w-3.5" aria-hidden />
            <span>{fromCache ? "Cached locally" : "Fresh from .spectra/"}</span>
        </span>
    );
}
