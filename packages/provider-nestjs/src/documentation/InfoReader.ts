import * as path from "node:path";

import type { Info } from "@spectra/core";

import type { SpectraConfig } from "../config/SpectraConfig";

/**
 * G1 — InfoReader.
 *
 * Produces the `Info` portion of the `Documentation` model from a
 * fully-merged `SpectraConfig` (produced by G0's `SpectraConfigLoader`).
 *
 * Required `Info` fields: `title`, `version`. Both must be present.
 * Optional `Info` fields: `summary`, `termsOfService`, `contact`,
 * `license` — all stay `undefined` unless the user has supplied
 * them. We never invent descriptions, contact, license, etc.
 *
 * Allowed fallbacks (purely derivation from what the project
 * already exposes — NOT invention):
 *   - `title`    = spectra.config.json → package.json "name" → dir
 *     basename. (Only ever the last is "made up" and it is a
 *     literal filesystem-path basename, not invented prose.)
 *   - `version` = spectra.config.json → package.json "version" →
 *     "0.0.0".
 *   - `summary`  = spectra.config.json → package.json "description"
 *     (treated as absent if empty / not a string) → undefined.
 */
export class InfoReader {
    public read(config: SpectraConfig): Info {
        const title =
            this.nonEmpty(config.infoTitle) ??
            path.basename(config.projectRoot) ??
            "Untitled";
        const version =
            this.nonEmpty(config.infoVersion) ?? "0.0.0";
        const summary = this.nonEmpty(config.infoSummary);
        return {
            id: "info",
            title,
            version,
            summary,
        };
    }

    private nonEmpty(s: string | undefined): string | undefined {
        return s !== undefined && s.length > 0 ? s : undefined;
    }
}
