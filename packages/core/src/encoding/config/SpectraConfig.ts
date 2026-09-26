import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

/**
 * The Spectra project-level configuration.
 *
 * <p>Stored at <code>&lt;projectRoot&gt;/.spectra/config.json</code>.
 * Currently holds the HTTP endpoint path the documentation server
 * should mount on, but the schema is intentionally open so future
 * fields (theme, navigation overrides, version pinning, …) can be
 * added without another breaking schema change.</p>
 */
export interface SpectraConfig {
    /** HTTP endpoint the documentation server should expose. */
    readonly endpoint: string;
    /** Schema version for forward-compatible parsing. */
    readonly schemaVersion: 1;
    /** When the config was last written, as an ISO-8601 string. */
    readonly updatedAt: string;
}

/** Default endpoint used when neither the CLI flag nor a saved
 *  config provide a value. */
export const SPECTRA_DEFAULT_ENDPOINT = "/spectra";

/**
 * File name (under `.spectra/`) where the config is stored.
 */
export const SPECTRA_CONFIG_FILE_NAME = "config.json";

/**
 * Resolve the conventional `<projectRoot>/.spectra/config.json`
 * path. Pure helper — no I/O.
 */
export function resolveSpectraConfigPath(projectRoot: string): string {
    return path.join(projectRoot, ".spectra", SPECTRA_CONFIG_FILE_NAME);
}

/**
 * Read the Spectra config from `<projectRoot>/.spectra/config.json`.
 * Returns `undefined` when no config exists yet — callers that need
 * a value should fall back to {@link SPECTRA_DEFAULT_ENDPOINT} or
 * generate a fresh endpoint name.
 */
export async function readSpectraConfig(
    projectRoot: string,
): Promise<SpectraConfig | undefined> {
    const target = resolveSpectraConfigPath(projectRoot);
    let raw: string;
    try {
        raw = await readFile(target, "utf-8");
    } catch {
        return undefined;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return undefined;
    }

    if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>).endpoint !== "string"
    ) {
        return undefined;
    }

    const endpoint = (parsed as Record<string, unknown>).endpoint as string;
    return {
        endpoint,
        schemaVersion: 1,
        updatedAt:
            typeof (parsed as Record<string, unknown>).updatedAt === "string"
                ? ((parsed as Record<string, unknown>).updatedAt as string)
                : new Date(0).toISOString(),
    };
}

/**
 * Write the Spectra config to `<projectRoot>/.spectra/config.json`,
 * creating `.spectra/` if it doesn't exist. Overwrites any existing
 * file.
 */
export async function writeSpectraConfig(
    projectRoot: string,
    config: Omit<SpectraConfig, "schemaVersion" | "updatedAt">,
): Promise<string> {
    const dir = path.join(projectRoot, ".spectra");
    const target = path.join(dir, SPECTRA_CONFIG_FILE_NAME);
    await mkdir(dir, { recursive: true });

    const full: SpectraConfig = {
        endpoint: config.endpoint,
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
    };

    await writeFile(target, JSON.stringify(full, null, 2), "utf-8");
    return target;
}
