import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import * as path from "node:path";

/**
 * Framework-agnostic project inspector.
 *
 * Reads the small set of files that EVERY TypeScript / Node backend
 * framework (NestJS, Express, Fastify, Koa, Hono, …) relies on at
 * bootstrap time:
 *
 *   - `tsconfig.json`     → resolved absolute path (used by the AST scanner)
 *   - `package.json`      → raw fields used by `Info` (title / version /
 *                           description)
 *   - `.env*`             → key/value pairs read as plain text, used for
 *                           server URL discovery when the framework is
 *                           configured through environment variables.
 *
 * No application code is executed. No decorator / class / function /
 * factory is invoked. No TypeChecker / TypeResolver / SymbolResolver
 * is reused or duplicated here — this layer is intentionally below
 * the AST scanner. It is pure fs I/O + JSON parsing + line-based env
 * parsing. Framework providers (NestJS, Express, …) consume this
 * layer and add their own bootstrap-specific inspectors on top.
 */
export interface ProjectInspection {
    /** The directory that was inspected. Absolute path. */
    readonly projectRoot: string;

    /**
     * Resolved absolute path to the `tsconfig.json` file, or
     * `undefined` if no `tsconfig.json` exists in the project root.
     * Callers that require a tsconfig should handle the undefined
     * case explicitly (the AST scanner cannot run without one).
     */
    readonly tsconfigPath: string | undefined;

    /**
     * Subset of `package.json` that is meaningful for documentation
     * generation. `undefined` if `package.json` is missing or
     * malformed. Field shapes are validated; non-string values are
     * dropped.
     */
    readonly packageJson: ProjectPackageJson | undefined;

    /**
     * Environment variables discovered from `.env`, `.env.local`,
     * `.env.development`, etc. Last file wins for duplicate keys
     * (matches the convention used by most Node libraries).
     * Missing files are silently skipped.
     */
    readonly env: Readonly<Record<string, string>>;
}

/**
 * The minimum package.json surface this inspector cares about. It
 * intentionally does NOT model every possible package.json field —
 * other layers (SpectraConfig) already do that and consume the raw
 * object. This is just the read-only subset.
 */
export interface ProjectPackageJson {
    readonly name?: string;
    readonly version?: string;
    readonly description?: string;
    /** All raw fields as parsed. Useful for providers that need
     *  extra fields (scripts, license, etc.). */
    readonly raw: Readonly<Record<string, unknown>>;
}

export class ProjectInspector {
    /**
     * File names considered when collecting environment variables.
     * Order matters: later files override earlier ones.
     */
    private static readonly ENV_FILES = [
        ".env",
        ".env.local",
        ".env.development",
        ".env.production",
    ];

    public inspect(projectRoot: string): ProjectInspection {
        const absoluteRoot = path.resolve(projectRoot);
        this.assertDirectory(absoluteRoot);

        return {
            projectRoot: absoluteRoot,
            tsconfigPath: this.findTsconfig(absoluteRoot),
            packageJson: this.readPackageJson(absoluteRoot),
            env: this.readEnvFiles(absoluteRoot),
        };
    }

    private assertDirectory(absoluteRoot: string): void {
        if (!existsSync(absoluteRoot)) {
            throw new Error(
                `ProjectInspector: project root does not exist: ${absoluteRoot}`,
            );
        }
        const stat = statSync(absoluteRoot);
        if (!stat.isDirectory()) {
            throw new Error(
                `ProjectInspector: project root is not a directory: ${absoluteRoot}`,
            );
        }
    }

    private findTsconfig(projectRoot: string): string | undefined {
        const candidate = path.join(projectRoot, "tsconfig.json");
        return existsSync(candidate) ? candidate : undefined;
    }

    private readPackageJson(
        projectRoot: string,
    ): ProjectPackageJson | undefined {
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
        const out: {
            name?: string;
            version?: string;
            description?: string;
            raw: Record<string, unknown>;
        } = { raw: obj };

        if (typeof obj.name === "string") out.name = obj.name;
        if (typeof obj.version === "string") out.version = obj.version;
        if (typeof obj.description === "string") {
            out.description = obj.description;
        }

        return out;
    }

    private readEnvFiles(
        projectRoot: string,
    ): Readonly<Record<string, string>> {
        const merged: Record<string, string> = {};
        for (const fileName of ProjectInspector.ENV_FILES) {
            const filePath = path.join(projectRoot, fileName);
            if (!existsSync(filePath)) continue;
            const parsed = this.parseDotEnv(
                readFileSync(filePath, "utf-8"),
            );
            for (const [key, value] of Object.entries(parsed)) {
                merged[key] = value;
            }
        }
        return merged;
    }

    /**
     * Minimal, dependency-free `.env` parser. Supports:
     *   - `KEY=value`
     *   - `KEY="quoted value with spaces"`
     *   - `KEY='single quoted'`
     *   - blank lines
     *   - `# comments`
     *
     * It does NOT support variable interpolation (`${OTHER}`),
     * `export` prefix, or multiline values. Those are deliberately
     * out of scope: this inspector only reads what was literally
     * written in the file.
     */
    private parseDotEnv(contents: string): Record<string, string> {
        const result: Record<string, string> = {};
        const lines = contents.split(/\r?\n/);
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (line.length === 0) continue;
            if (line.startsWith("#")) continue;
            const stripped = line.startsWith("export ")
                ? line.slice("export ".length).trim()
                : line;
            const eq = stripped.indexOf("=");
            if (eq <= 0) continue;
            const key = stripped.slice(0, eq).trim();
            let value = stripped.slice(eq + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            result[key] = value;
        }
        return result;
    }

    /**
     * List the contents of `projectRoot`, excluding `node_modules`,
     * `dist`, `.turbo`, `.git`, and `.next`. Intended for downstream
     * inspectors that need to locate `main.ts` or `app.module.ts`.
     *
     * Returned paths are absolute.
     */
    public listSourceFiles(projectRoot: string): readonly string[] {
        const absoluteRoot = path.resolve(projectRoot);
        if (!existsSync(absoluteRoot)) return [];
        const ignore = new Set([
            "node_modules",
            "dist",
            ".turbo",
            ".git",
            ".next",
        ]);
        const out: string[] = [];
        const walk = (dir: string): void => {
            let entries: string[];
            try {
                entries = readdirSync(dir);
            } catch {
                return;
            }
            for (const entry of entries) {
                if (ignore.has(entry)) continue;
                const full = path.join(dir, entry);
                let stat;
                try {
                    stat = statSync(full);
                } catch {
                    continue;
                }
                if (stat.isDirectory()) {
                    walk(full);
                } else if (stat.isFile()) {
                    out.push(full);
                }
            }
        };
        walk(absoluteRoot);
        return out;
    }
}