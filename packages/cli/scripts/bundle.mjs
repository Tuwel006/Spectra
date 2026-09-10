#!/usr/bin/env node
/**
 * Bundle the CLI into a single self-contained file.
 *
 * <p>The dist output of `tsc` is split across many files and depends
 * on the workspace's `.js` / extension-less import resolution rules —
 * which Node's ESM loader rejects (see node:ERR_MODULE_NOT_FOUND).
 * Producing a bundle sidesteps all of that by inlining the entire
 * dependency graph into one file the runtime can execute as-is.</p>
 *
 * <p>Output: <code>dist/spectra.mjs</code> with a shebang + ESM
 * marker so it can be invoked directly via <code>node …/spectra.mjs</code>
 * or via the <code>spectra</code> bin entry in package.json.</p>
 */

import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");

/** Where the bundled CLI lands. */
const OUT_DIR = path.join(pkgRoot, "dist");
const OUT_FILE = path.join(OUT_DIR, "spectra.mjs");

mkdirSync(OUT_DIR, { recursive: true });

/**
 * Bundling config. Key choices:
 *
 *   - `bundle: true`            inline every import into one file
 *   - `format: "esm"`           emit native ESM (matches `\"type\": \"module\"`)
 *   - `platform: "node"`        target Node, not the browser
 *   - `external: ["node:*"]`    leave Node built-ins as bare specifiers —
 *                               bundling them produces broken output
 *                               because they don't exist as files.
 *
 * Workspace deps (`@spectra/core`, `@spectra/provider-nestjs`) are
 * explicitly bundled — that's how the single-file output works
 * without breaking source code that uses extension-less imports.
 */
const result = await build({
    entryPoints: [path.join(pkgRoot, "src/index.ts")],
    outfile: OUT_FILE,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    sourcemap: false,
    minify: false,
    treeShaking: true,
    /**
     * Mark `typescript` as external because it uses dynamic require()
     * internally for filesystem access — bundling it as ESM breaks
     * those dynamic requires. Keeping it external means Node loads
     * it from node_modules at runtime, which works perfectly fine.
     *
     * `node:*` covers Node built-ins (fs, path, zlib, etc.).
     */
    external: ["typescript", "node:*"],
    logLevel: "info",
    metafile: true,
});

// Prepend the shebang so `node ./dist/spectra.mjs` and the bin
// link can execute the file directly. esbuild writes the file
// without a shebang by default (it doesn't know the output is meant
// to be invoked as a binary).
const shebang = "#!/usr/bin/env node\n";
const body = readFileSync(OUT_FILE, "utf8");
if (!body.startsWith("#!")) {
    writeFileSync(OUT_FILE, shebang + body);
}

// Mark the file executable on POSIX systems (no-op on Windows).
try {
    const { chmodSync } = await import("node:fs");
    chmodSync(OUT_FILE, 0o755);
} catch {
    /* best-effort */
}

console.log(`\n✓ bundled ${OUT_FILE}`);
console.log(`  ${(result.metafile?.outputs?.[OUT_FILE]?.bytes ?? 0).toLocaleString()} bytes`);
