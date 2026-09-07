"use client";

import * as React from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { mockDocumentation } from "@/mock/documentation";

/**
 * Workspace-level URL state.
 *
 * <p>The endpoint header URL bar is built from three parts:</p>
 *   1. **Server** — either a server picked from
 *      `mockDocumentation.servers` (production / staging / mock) OR a
 *      free-form custom URL entered by the user. Picked-server wins
 *      unless the user types a custom one.
 *   2. **Path**   — the path-template with `{var}` substitutions,
 *      edited via the path-param table.
 *   3. **Query**  — the query string, edited via the query-param table.
 *
 * <p>This store holds parts (1) only. Parts (2) and (3) continue to
 * live in the per-endpoint request draft so each tab keeps its own
 * params.</p>
 */
export interface UrlState {
    /** Selected server from the documentation. `undefined` = use the
     *  first server (default). */
    readonly selectedServerId: string | undefined;
    /** User-supplied custom base URL. When set, this OVERRIDES
     *  `selectedServerId`. Useful for hitting a local mock, a tunnel
     *  ngrok URL, or a PR review app. */
    readonly customServerUrl: string | undefined;

    setSelectedServer: (id: string | undefined) => void;
    setCustomServerUrl: (url: string | undefined) => void;
    resetServer: () => void;
}

const noopStorage = () => {
    if (typeof window === "undefined") {
        return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
        };
    }
    return window.localStorage;
};

export const useUrlStore = create<UrlState>()(
    persist(
        (set) => ({
            selectedServerId: undefined,
            customServerUrl: undefined,

            setSelectedServer: (id) =>
                set((state) =>
                    state.selectedServerId === id ? state : { selectedServerId: id },
                ),

            setCustomServerUrl: (url) =>
                set((state) => {
                    const trimmed = url?.trim();
                    if ((trimmed ?? "") === (state.customServerUrl ?? "")) {
                        return state;
                    }
                    return { customServerUrl: trimmed ? trimmed : undefined };
                }),

            resetServer: () =>
                set({ selectedServerId: undefined, customServerUrl: undefined }),
        }),
        {
            name: "spectra.url.v1",
            storage: createJSONStorage<UrlState>(() => noopStorage()),
        },
    ),
);

/**
 * Resolve the active server URL:
 *   - custom URL wins when set (non-empty)
 *   - otherwise the selected server from the docs
 *   - otherwise the first server in the docs
 */
export function resolveActiveServerUrl(state: UrlState): {
    readonly url: string;
    readonly isCustom: boolean;
    readonly serverId: string | undefined;
} {
    if (state.customServerUrl && state.customServerUrl.length > 0) {
        return { url: state.customServerUrl, isCustom: true, serverId: undefined };
    }
    const id = state.selectedServerId ?? mockDocumentation.servers[0]?.id;
    const server = mockDocumentation.servers.find((s) => s.id === id);
    const fallback = mockDocumentation.servers[0]?.url ?? "";
    return {
        url: server?.url ?? fallback,
        isCustom: false,
        serverId: server?.id,
    };
}

/* ------------------------------------------------------------------ */
/* Mount-flag helper (kept here so the URL bar stays self-contained)     */
/* ------------------------------------------------------------------ */

export function useUrlStoreMounted(): boolean {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    return mounted;
}