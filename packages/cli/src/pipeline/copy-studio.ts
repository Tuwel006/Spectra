import { cpSync, existsSync, mkdirSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy the bundled studio static files into `<projectRoot>/.spectra/studio/`.
 *
 * <p>Source resolution logic — works for both:</p>
 *
 * <ol>
 *   <li><strong>Dev (tsx):</strong> <code>src/pipeline/copy-studio.ts</code>
 *       is run directly. The studio lives at
 *       <code>../../../../apps/studio/out</code> in the monorepo.</li>
 *   <li><strong>Production (bundled):</strong> <code>spectra.mjs</code>
 *       lives at <code>packages/cli/dist/spectra.mjs</code>. The studio
 *       is at the sibling <code>packages/cli/dist/studio/</code>.</li>
 * </ol>
 *
 * <p>The resolved path is whichever directory contains an
 * <code>index.html</code> sitting next to a <code>_next/</code> folder.</p>
 *
 * <p>Beginner-friendly: we deliberately don't fail loud if the studio
 * isn't found — many users run the CLI on a deployment server where
 * only the bundled <code>spectra.mjs</code> is present. We just log a
 * warning so the build still completes and the user can generate the
 * doc without the UI.</p>
 */
export function copyBundledStudio(
    projectRoot: string,
    importMetaUrl: string,
): { copied: boolean; destination: string | undefined } {
    const here = path.dirname(fileURLToPath(importMetaUrl));
    const candidates = [
        // Bundled: spectra.mjs → sibling dist/studio/
        path.resolve(here, "studio"),
        // Dev: copy-studio.ts → monorepo apps/studio/out
        path.resolve(here, "..", "..", "..", "..", "apps", "studio", "out"),
        // Dev: copy-studio.ts → monorepo apps/studio/out (alternative path)
        path.resolve(here, "..", "..", "..", "apps", "studio", "out"),
    ];

    const source = candidates.find((candidate) =>
        existsSync(path.join(candidate, "index.html")),
    );

    if (!source) {
        return { copied: false, destination: undefined };
    }

    const destination = path.join(projectRoot, ".spectra", "studio");
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
    return { copied: true, destination };
}
