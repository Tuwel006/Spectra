"use client";

import { useEffect, useState, useCallback } from "react";

import type { Documentation } from "@spectra/core";

import { loadDocumentBin, type DecodedDocument } from "./decodeDocumentBin";

/* ------------------------------------------------------------------ */
/* localStorage key                                                   */
/* ------------------------------------------------------------------ */

/**
 * The localStorage key under which we cache the decoded document.
 *
 * <p>Beginner-friendly: keys are namespaced by the endpoint so a
 * project serving its docs at <code>/spectra</code> doesn't collide
 * with another project at <code>/api-docs</code> served from the
 * same origin.</p>
 */
function docKey(endpoint: string): string {
    return `spectra-doc:${endpoint}`;
}

function endpointFromLocation(): string {
    if (typeof window === "undefined") return "/spectra";
    return window.location.pathname.replace(/\/$/, "") || "/spectra";
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

/**
 * State returned by {@link useDocumentation}.
 */
export interface DocumentationState {
    /** The active documentation — either from localStorage or freshly loaded. */
    readonly documentation: Documentation | undefined;
    /**
     * "loading" while we fetch + decode on first mount.
     * "ready" once `documentation` is populated.
     * "error" if the fetch / decode failed (network down, magic mismatch, etc).
     */
    readonly status: "loading" | "ready" | "error";
    readonly error?: string;
    /** True when the active doc was loaded from localStorage (vs freshly fetched). */
    readonly fromCache: boolean;
    /** True when the user has unsaved local edits on top of the cached base. */
    readonly hasUnsavedEdits: boolean;
    /** The SHA-1 of `documentation.info.version` — used as the cache invalidation key. */
    readonly version: number | undefined;
}

export interface DocumentationActions {
    /** Persist the current view to localStorage. */
    save: () => void;
    /** Drop the localStorage cache and re-fetch + decode from document.bin. */
    reset: () => Promise<void>;
    /** Export the active doc as a JSON string (for download / sharing). */
    exportJson: () => string | undefined;
}

export type UseDocumentationResult = DocumentationState & DocumentationActions;

/**
 * Hook that gives the React tree reactive access to the active doc.
 *
 * <p>Lifecycle:</p>
 * <ol>
 *   <li>First mount → synchronously read localStorage. If present, use it
 *       (status="ready", fromCache=true).</li>
 *   <li>If nothing cached → fetch and decode document.bin (status="loading"
 *       → "ready", fromCache=false).</li>
 *   <li>Save → write the current doc to localStorage with `spectra-doc-{endpoint}`.</li>
 *   <li>Reset → drop the key, return to step 2.</li>
 * </ol>
 *
 * <p>This hook <strong>never</strong> writes to document.bin itself.
 * document.bin is the source of truth and only changes when the user
 * re-runs `spectra generate`. localStorage is just a perf + UX
 * cache.</p>
 */
export function useDocumentation(): UseDocumentationResult {
    const endpoint = endpointFromLocation();
    const key = docKey(endpoint);

    const [state, setState] = useState<DocumentationState>(() => {
        if (typeof window === "undefined") {
            return { documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined };
        }
        const cached = readCache(key);
        if (cached) {
            return {
                documentation: cached.documentation,
                status: "ready",
                fromCache: true,
                hasUnsavedEdits: false,
                version: cached.version,
            };
        }
        return { documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined };
    });

    useEffect(() => {
        // If we hydrated from cache, no fetch needed.
        if (state.fromCache || state.status === "error") return;

        let cancelled = false;

        loadDocumentBin("document.bin")
            .then((decoded: DecodedDocument) => {
                if (cancelled) return;
                setState({
                    documentation: decoded.documentation,
                    status: "ready",
                    fromCache: false,
                    hasUnsavedEdits: false,
                    version: decoded.version,
                });
            })
            .catch((err) => {
                if (cancelled) return;
                setState({
                    documentation: undefined,
                    status: "error",
                    fromCache: false,
                    hasUnsavedEdits: false,
                    version: undefined,
                    error: err instanceof Error ? err.message : String(err),
                });
            });

        return () => {
            cancelled = true;
        };
    }, [endpoint, state.fromCache, state.status]);

    const save = useCallback(() => {
        if (!state.documentation) return;
        writeCache(key, {
            documentation: state.documentation,
            version: state.version ?? 0,
            savedAt: Date.now(),
        });
        setState((prev) => ({ ...prev, hasUnsavedEdits: false }));
    }, [key, state.documentation, state.version]);

    const reset = useCallback(async () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
        }
        setState({ documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined });
        const decoded = await loadDocumentBin("document.bin");
        setState({
            documentation: decoded.documentation,
            status: "ready",
            fromCache: false,
            hasUnsavedEdits: false,
            version: decoded.version,
        });
    }, [key]);

    const exportJson = useCallback((): string | undefined => {
        if (!state.documentation) return undefined;
        return JSON.stringify(state.documentation, null, 2);
    }, [state.documentation]);

    return {
        documentation: state.documentation,
        status: state.status,
        error: state.error,
        fromCache: state.fromCache,
        hasUnsavedEdits: state.hasUnsavedEdits,
        version: state.version,
        save,
        reset,
        exportJson,
    };
}

/* ------------------------------------------------------------------ */
/* Cache helpers                                                       */
/* ------------------------------------------------------------------ */

interface CachePayload {
    readonly documentation: Documentation;
    readonly version: number;
    readonly savedAt: number;
}

function readCache(key: string): CachePayload | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return undefined;
        return JSON.parse(raw) as CachePayload;
    } catch {
        return undefined;
    }
}

function writeCache(key: string, payload: CachePayload): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
        /* quota or serialization failure — ignore silently */
    }
}
