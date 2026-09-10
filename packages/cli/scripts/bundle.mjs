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
 *
 * <p>The build also stages the studio's static export from
 * <code>apps/studio/out/</code> into <code>dist/studio/</code> so
 * the runtime NestJS module can serve the docs UI straight from the
 * CLI tarball — no extra install step required at the user's
 * project.</p>
 */

import { build } from "esbuild";
import { cpSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
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
 *   - `external: ["typescript"]` keep typescript external — it uses
 *                               dynamic require() internally that
 *                               ESM can't model cleanly
 *   - `external: ["node:*"]`    leave Node built-ins as bare specifiers
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
    external: ["typescript", "node:*"],
    logLevel: "info",
    metafile: true,
});

// Prepend the shebang so `node ./dist/spectra.mjs` and the bin
// link can execute the file directly. esbuild writes the file
// without a shebang by default.
const shebang = "#!/usr/bin/env node\n";
const body = readFileSync(OUT_FILE, "utf8");
if (!body.startsWith("#!")) {
    writeFileSync(OUT_FILE, shebang + body);
}

try {
    const { chmodSync } = await import("node:fs");
    chmodSync(OUT_FILE, 0o755);
} catch {
    /* best-effort */
}

console.log(`\n✓ bundled ${OUT_FILE}`);
console.log(`  ${(result.metafile?.outputs?.[OUT_FILE]?.bytes ?? 0).toLocaleString()} bytes`);

/* ------------------------------------------------------------------ */
/* Studio copy                                                         */
/* ------------------------------------------------------------------ */
//
// Copy the pre-built studio into dist/studio/ so the published CLI
// tarball ships the docs UI as well. The path is resolved relative
// to the monorepo root (../../apps/studio/out) — this script only
// runs in the monorepo, never as a standalone CLI invocation.
//
// Skip silently if the studio hasn't been built yet — pure-TS
// contributors won't always run `pnpm --filter studio build` before
// building the CLI, and that's fine. The CLI will surface a clean
// error message at runtime if `.spectra/studio/index.html` is
// missing.

const studioSrc = path.resolve(pkgRoot, "..", "..", "apps", "studio", "out");
const studioDst = path.join(OUT_DIR, "studio");

if (existsSync(studioSrc)) {
    cpSync(studioSrc, studioDst, { recursive: true });
    console.log(`✓ staged studio → ${path.relative(process.cwd(), studioDst)}`);
} else {
    console.warn(
        `⚠ studio not built yet — skipping. Run \`pnpm --filter studio build\` and re-run this script.`,
    );
}
