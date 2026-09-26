import * as path from "node:path";
import {
    existsSync,
    readFileSync,
} from "node:fs";

import {
    readSpectraConfig,
    SPECTRA_DEFAULT_ENDPOINT,
} from "@spectra/core/encoding";

export interface ResolveEndpointOptions {
    readonly explicit?: string;
    readonly autoGenerate: boolean;
    readonly projectRoot: string;
}

export interface ResolvedEndpoint {
    readonly endpoint: string;
    readonly source:
        | "cli-explicit"
        | "cli-auto"
        | "config-existing"
        | "default";
}

export async function resolveEndpoint(
    options: ResolveEndpointOptions,
): Promise<ResolvedEndpoint> {
    if (options.explicit) {
        return {
            endpoint: normalizeEndpoint(
                options.explicit,
            ),
            source: "cli-explicit",
        };
    }

    if (options.autoGenerate) {
        return {
            endpoint:
                generateEndpoint(
                    options.projectRoot,
                ),
            source: "cli-auto",
        };
    }

    const existing =
        await readSpectraConfig(
            options.projectRoot,
        );

    if (existing) {
        return {
            endpoint: existing.endpoint,
            source: "config-existing",
        };
    }

    return {
        endpoint: SPECTRA_DEFAULT_ENDPOINT,
        source: "default",
    };
}

function generateEndpoint(
    projectRoot: string,
): string {
    const packageName =
        readPackageName(projectRoot);

    if (!packageName) {
        return SPECTRA_DEFAULT_ENDPOINT;
    }

    const slug = packageName
        .replace(/^@/, "")
        .replace(
            /[^a-zA-Z0-9]+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        )
        .toLowerCase();

    if (!slug) {
        return SPECTRA_DEFAULT_ENDPOINT;
    }

    return `/${slug}-docs`;
}

function readPackageName(
    projectRoot: string,
): string | undefined {
    const packagePath = path.join(
        projectRoot,
        "package.json",
    );

    if (!existsSync(packagePath)) {
        return undefined;
    }

    try {
        const packageJson = JSON.parse(
            readFileSync(
                packagePath,
                "utf8",
            ),
        ) as {
            name?: unknown;
        };

        return typeof packageJson.name ===
            "string"
            ? packageJson.name
            : undefined;
    } catch {
        return undefined;
    }
}

function normalizeEndpoint(
    value: string,
): string {
    const trimmed = value.trim();

    if (!trimmed) {
        return SPECTRA_DEFAULT_ENDPOINT;
    }

    const withSlash =
        trimmed.startsWith("/")
            ? trimmed
            : `/${trimmed}`;

    return (
        withSlash.replace(
            /\/+$/,
            "",
        ) || "/"
    );
}