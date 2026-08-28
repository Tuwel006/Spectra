import {
    existsSync,
    readFileSync,
    statSync,
} from "node:fs";
import * as path from "node:path";

/**
 * G0 — Configuration loading foundation.
 *
 * Pure data-shape + loader. No application code is ever executed.
 * No DTO / class / controller / module is ever instantiated.
 * No decorator callback is ever invoked. No TypeChecker / TypeResolver
 * is duplicated — this layer reuses the host project's
 * `package.json` only as a static text file via `readFileSync`.
 *
 * The `SpectraConfig` shape is the immutable, fully-merged
 * configuration that later Documentation-Generation steps (G1+) will
 * consume. Defaults are applied for every optional field.
 *
 * Layered resolution:
 *   1. Hard-coded safe defaults (in code, below).
 *   2. `<projectRoot>/package.json` for `name` / `version` /
 *      `description` (if present, only string fields; never
 *      evaluated).
 *   3. `<projectRoot>/spectra.config.json` overrides anything
 *      above (only the fields the user explicitly set; partial
 *      configs are accepted).
 *   4. Caller can pass `overrideRoot` to force a project root.
 *
 * If `spectra.config.json` exists but is malformed, `SpectraConfigError`
 * is thrown with a clear message. Missing files are NEVER an error.
 *
 * No information that the user did not provide is ever invented:
 *   - Default `title` = `package.json.name` OR directory basename.
 *   - Default `version` = `package.json.version` OR `"0.0.0"`.
 *   - Default `description` = `package.json.description` OR
 *     `undefined` (caller decides how to render).
 *   - Default `servers[0].url` = `"http://localhost:3000"`.
 *     (Purely a placeholder; the real server URL must be set by the
 *     user if needed.)
 */

export type SpectraOutputFormat = "json";

export interface SpectraInfoConfig {
    readonly title?: string;
    readonly version?: string;
    readonly description?: string;
}

export interface SpectraServerConfig {
    readonly url: string;
    readonly description?: string;
}

export interface SpectraOutputConfig {
    readonly path?: string;
    readonly format?: SpectraOutputFormat;
}

export interface SpectraUserConfig {
    readonly projectRoot?: string;
    readonly output?: SpectraOutputConfig;
    readonly info?: SpectraInfoConfig;
    readonly servers?: readonly SpectraServerConfig[];
}

/** Immutable, fully-merged configuration. */
export interface SpectraConfig {
    readonly projectRoot: string;
    readonly outputPath: string;
    readonly outputFormat: SpectraOutputFormat;
    readonly infoTitle: string;
    readonly infoVersion: string;
    /** `undefined` if neither `spectra.config.json` nor `package.json` provided one. */
    readonly infoSummary: string | undefined;
    readonly servers: readonly SpectraServerConfig[];
}

export class SpectraConfigError extends Error {
    public constructor(message: string) {
        super(message);
        this.name = "SpectraConfigError";
    }
}

/** Read-only view of `package.json` that this layer needs. */
interface PackageJsonSubset {
    readonly name?: string;
    readonly version?: string;
    readonly description?: string;
}

/**
 * Loads and merges configuration from:
 *   1. Caller-supplied `overrideRoot` (optional, takes priority).
 *   2. `<projectRoot>/spectra.config.json` (optional, merged).
 *   3. `<projectRoot>/package.json` (optional, fallback for Info).
 *   4. Safe hard-coded defaults.
 *
 * No application code is invoked. No third-party configuration
 * library is introduced.
 */
export class SpectraConfigLoader {
    public load(overrideRoot?: string): SpectraConfig {
        const projectRoot = this.resolveProjectRoot(overrideRoot);
        const fromFile = this.readConfigFile(projectRoot);
        const fromPackage = this.readPackageJson(projectRoot);
        return this.merge(projectRoot, fromFile, fromPackage);
    }

    private resolveProjectRoot(overrideRoot: string | undefined): string {
        const root = overrideRoot ?? process.cwd();
        if (!existsSync(root)) {
            throw new SpectraConfigError(
                `Project root does not exist: ${root}`,
            );
        }
        const stat = statSync(root);
        if (!stat.isDirectory()) {
            throw new SpectraConfigError(
                `Project root is not a directory: ${root}`,
            );
        }
        return path.resolve(root);
    }

    private readConfigFile(
        projectRoot: string,
    ): SpectraUserConfig | undefined {
        const filePath = path.join(projectRoot, "spectra.config.json");
        if (!existsSync(filePath)) return undefined;
        const raw = readFileSync(filePath, "utf-8");
        let data: unknown;
        try {
            data = JSON.parse(raw);
        } catch (e) {
            throw new SpectraConfigError(
                `Invalid JSON in ${filePath}: ${(e as Error).message}`,
            );
        }
        this.validateUserConfig(data);
        return data as SpectraUserConfig;
    }

    private readPackageJson(
        projectRoot: string,
    ): PackageJsonSubset | undefined {
        const filePath = path.join(projectRoot, "package.json");
        if (!existsSync(filePath)) return undefined;
        let raw: unknown;
        try {
            raw = JSON.parse(readFileSync(filePath, "utf-8"));
        } catch {
            return undefined;
        }
        if (typeof raw !== "object" || raw === null) return undefined;
        const obj = raw as Record<string, unknown>;
        const out: { name?: string; version?: string; description?: string } = {};
        if (typeof obj.name === "string") out.name = obj.name;
        if (typeof obj.version === "string") out.version = obj.version;
        if (typeof obj.description === "string") out.description = obj.description;
        return out;
    }

    private validateUserConfig(data: unknown): void {
        if (typeof data !== "object" || data === null) {
            throw new SpectraConfigError(
                "spectra.config.json must be a JSON object",
            );
        }
        const d = data as Record<string, unknown>;
        if ("projectRoot" in d && typeof d.projectRoot !== "string") {
            throw new SpectraConfigError(
                "spectra.config.json: projectRoot must be a string",
            );
        }
        if ("output" in d) {
            this.validateOutputConfig(d.output);
        }
        if ("info" in d) {
            this.validateInfoConfig(d.info);
        }
        if ("servers" in d) {
            this.validateServersConfig(d.servers);
        }
    }

    private validateOutputConfig(value: unknown): void {
        if (typeof value !== "object" || value === null) {
            throw new SpectraConfigError(
                "spectra.config.json: output must be an object",
            );
        }
        const o = value as Record<string, unknown>;
        if ("path" in o && typeof o.path !== "string") {
            throw new SpectraConfigError(
                "spectra.config.json: output.path must be a string",
            );
        }
        if ("format" in o && o.format !== "json") {
            throw new SpectraConfigError(
                `spectra.config.json: output.format must be "json" (got ${JSON.stringify(o.format)})`,
            );
        }
    }

    private validateInfoConfig(value: unknown): void {
        if (typeof value !== "object" || value === null) {
            throw new SpectraConfigError(
                "spectra.config.json: info must be an object",
            );
        }
        const i = value as Record<string, unknown>;
        for (const key of ["title", "version", "description"]) {
            if (key in i && typeof i[key] !== "string") {
                throw new SpectraConfigError(
                    `spectra.config.json: info.${key} must be a string`,
                );
            }
        }
    }

    private validateServersConfig(value: unknown): void {
        if (!Array.isArray(value)) {
            throw new SpectraConfigError(
                "spectra.config.json: servers must be an array",
            );
        }
        for (let i = 0; i < value.length; i++) {
            const s = value[i] as Record<string, unknown>;
            if (typeof s !== "object" || s === null) {
                throw new SpectraConfigError(
                    `spectra.config.json: servers[${i}] must be an object`,
                );
            }
            if (typeof s.url !== "string") {
                throw new SpectraConfigError(
                    `spectra.config.json: servers[${i}].url must be a string`,
                );
            }
        }
    }

    private merge(
        projectRoot: string,
        fromFile: SpectraUserConfig | undefined,
        fromPackage: PackageJsonSubset | undefined,
    ): SpectraConfig {
        const dirName = path.basename(projectRoot);
        const infoTitle =
            fromFile?.info?.title ??
            fromPackage?.name ??
            dirName;
        const infoVersion =
            fromFile?.info?.version ??
            fromPackage?.version ??
            "0.0.0";
        const infoSummary =
            fromFile?.info?.description ??
            fromPackage?.description;

        const outputPath = this.resolveOutputPath(
            projectRoot,
            fromFile?.output?.path,
        );
        const outputFormat: SpectraOutputFormat =
            fromFile?.output?.format ?? "json";

        const servers: readonly SpectraServerConfig[] =
            fromFile?.servers ?? [{ url: "http://localhost:3000" }];

        return {
            projectRoot,
            outputPath,
            outputFormat,
            infoTitle,
            infoVersion,
            infoSummary,
            servers,
        };
    }

    private resolveOutputPath(
        projectRoot: string,
        override: string | undefined,
    ): string {
        const p =
            override ??
            path.join(projectRoot, "spectra-output", "documentation.json");
        return path.isAbsolute(p) ? p : path.resolve(projectRoot, p);
    }
}
