/**
 * Endpoint resolution — turn the user's CLI flags + the project's
 * existing config into the final endpoint path that gets stored in
 * `<projectRoot>/.spectra/config.json`.
 *
 * <p>Resolution rules (applied in order):</p>
 * <ol>
 *   <li><strong>--endpoint /value</strong> — explicit path. Use it
 *       verbatim.</li>
 *   <li><strong>--endpoint</strong> (no value) — auto-generate a
 *       sensible default. We use the project's package name (when
 *       available) or a fixed "api-docs" fallback.</li>
 *   <li><strong>no flag</strong> — keep the existing config's
 *       endpoint, falling back to {@link SPECTRA_DEFAULT_ENDPOINT}
 *       when no config exists yet.</li>
 * </ol>
 */

import * as path from "node:path";
import { readFileSync, existsSync } from "node:fs";

import {
    readSpectraConfig,
    SPECTRA_DEFAULT_ENDPOINT,
} from "@spectra/core/encoding";

/** Result of resolving the endpoint value for one CLI invocation. */
export interface ResolvedEndpoint {
    /** The final endpoint path (e.g. `/api-docs`). */
    readonly endpoint: string;
    /** Where the endpoint came from — useful for logging. */
    readonly source: EndpointSource;
}

export type EndpointSource =
    | "cli-explicit"
    | "cli-auto"
    | "config-existing"
    | "default";

/**
 * Options accepted by {@link resolveEndpoint}.
 */
export interface ResolveEndpointOptions {
    /** Value passed via `--endpoint <value>`. */
    readonly explicit?: string;
    /** True when the user typed `--endpoint` without a value. */
    readonly autoGenerate: boolean;
    /** Project root — used to look up existing config + package.json. */
    readonly projectRoot: string;
}

/**
 * Apply the resolution rules described in the file header.
 */
export async function resolveEndpoint(
    options: ResolveEndpointOptions,
): Promise<ResolvedEndpoint> {
    // Rule 1 — explicit value wins.
    if (options.explicit && options.explicit.length > 0) {
        return {
            endpoint: normaliseEndpoint(options.explicit),
            source: "cli-explicit",
        };
    }

    // Rule 2 — `--endpoint` with no value → auto-generate.
    if (options.autoGenerate) {
        const generated = await generateEndpoint(options.projectRoot);
        return {
            endpoint: generated,
            source: "cli-auto",
        };
    }

    // Rule 3a — keep existing config value if present.
    const existing = await readSpectraConfig(options.projectRoot);
    if (existing) {
        return {
            endpoint: existing.endpoint,
            source: "config-existing",
        };
    }

    // Rule 3b — fall back to package default.
    return {
        endpoint: SPECTRA_DEFAULT_ENDPOINT,
        source: "default",
    };
}

/**
 * Auto-generate an endpoint path from the project's package.json
 * (preferred — uses the package name) or fall back to `api-docs`.
 *
 * <p>The output is always a clean URL path: starts with `/`,
 * lowercase, hyphenated, no extension. Example outputs:</p>
 *
 * <pre>
 *   "My Cool API"   →  "/my-cool-api-docs"
 *   "@acme/server"  →  "/acme-server-docs"
 *   undefined       →  "/api-docs"
 * </pre>
 */
async function generateEndpoint(projectRoot: string): Promise<string> {
    const packageName = readPackageName(projectRoot);
    if (!packageName) {
        return "/api-docs";
    }
    // Strip scope prefix: "@acme/server" → "acme/server" → "acme-server".
    const unscoped = packageName.replace(/^@/, "");
    const slug = unscoped.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) return "/api-docs";
    return `/${slug}-docs`;
}

/**
 * Best-effort read of the package name from `<root>/package.json`.
 * Returns `undefined` when the file is missing or malformed.
 */
function readPackageName(projectRoot: string): string | undefined {
    const pkgPath = path.join(projectRoot, "package.json");
    if (!existsSync(pkgPath)) return undefined;
    try {
        const raw = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
        if (typeof raw.name === "string" && raw.name.length > 0) {
            return raw.name;
        }
    } catch {
        /* ignore malformed package.json */
    }
    return undefined;
}

/**
 * Normalise an endpoint value provided by the user — ensures it
 * starts with `/`, trims trailing whitespace, preserves everything
 * else verbatim. Examples:
 *
 * <pre>
 *   "api-docs"   →  "/api-docs"
 *   "/api-docs"  →  "/api-docs"
 *   "  /foo/  "  →  "/foo"
 *   ""           →  "/"  (caller should not invoke with empty)
 * </pre>
 */
function normaliseEndpoint(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return SPECTRA_DEFAULT_ENDPOINT;
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return withSlash.replace(/\/+$/, "") || "/";
}
