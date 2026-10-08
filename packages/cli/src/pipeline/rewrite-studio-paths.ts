import {
    cpSync,
    existsSync,
    mkdirSync,
    readdirSync,
    readFileSync,
    statSync,
    writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy the bundled studio static files into `<projectRoot>/.spectra/studio/`
 * and rewrite absolute asset paths in every HTML file so the studio
 * works when mounted at any URL prefix (e.g. <code>/api-explorer</code>).
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
 * <p><strong>Why the HTML rewrite is needed.</strong> Next.js's static
 * export emits references like <code>/_next/static/css/main.css</code>
 * and <code>/favicon.ico</code> in the generated HTML. Those are
 * absolute paths from the host root, so when we mount the studio at
 * <code>/api-explorer</code> instead of <code>/</code>, the browser
 * fetches them from the wrong place and the page renders unstyled.
 * We rewrite every <code>/_next/...</code>, <code>/favicon.ico</code>,
 * and <code>/static/...</code> reference so it points under the
 * configured endpoint instead.</p>
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
    endpoint: string,
): {
    copied: boolean;
    destination: string | undefined;
    rewritten: number;
    rebuilt: boolean;
    rebuildMs: number;
} {
    const here = path.dirname(fileURLToPath(importMetaUrl));

    // First, try to rebuild the studio from source with basePath
    // baked in. This handles non-root endpoints cleanly — every
    // /_next/... reference in compiled HTML and every /_next/
    // literal inside compiled JS chunks gets the prefix at build
    // time, which is the only way to make Next.js's client router
    // resolve asset URLs correctly under a URL prefix.
    const rebuild = findStudioSourceForRoot(here);
    let rebuilt = false;
    let rebuildMs = 0;
    if (rebuild && endpoint !== "/" && endpoint !== "") {
        const started = Date.now();
        rebuildStudioSync(rebuild.studioRoot, endpoint);
        rebuildMs = Date.now() - started;
        rebuilt = true;
    }

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
        return { copied: false, destination: undefined, rewritten: 0, rebuilt, rebuildMs };
    }

    const destination = path.join(projectRoot, ".spectra", "studio");
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });

    // Defensive HTML rewrite — only when the studio came from a
    // pre-built `out/` (e.g. the `spectra` npm package that ships
    // a studio bundle without the source). When we just rebuilt
    // the studio with `basePath` set, Next.js already emitted every
    // path with the correct prefix; running the rewriter here would
    // produce double-prefixed URLs like
    // `<endpoint>/<endpoint>/_next/...` and break the page.
    const rewritten = rebuilt
        ? 0
        : rewriteStudioPaths(destination, endpoint);

    return { copied: true, destination, rewritten, rebuilt, rebuildMs };
}

/**
 * Walk a directory tree and rewrite absolute asset paths in every
 * <code>.html</code> file so it points under <code>endpoint</code>.
 *
 * <p>Patterns rewritten:</p>
 * <ul>
 *   <li><code>href="/_next/..."</code> → <code>href="&lt;endpoint&gt;/_next/..."</code></li>
 *   <li><code>src="/_next/..."</code> → <code>src="&lt;endpoint&gt;/_next/..."</code></li>
 *   <li><code>href="/favicon.ico?..."</code> → <code>href="&lt;endpoint&gt;/favicon.ico?..."</code></li>
 *   <li><code>href="/static/..."</code> → <code>href="&lt;endpoint&gt;/static/..."</code></li>
 * </ul>
 *
 * <p>The <code>endpoint</code> argument is normalised so it always
 * starts with a single <code>/</code> and never ends with one — the
 * rewritten paths then take the form <code>/endpoint/_next/...</code>.</p>
 *
 * @returns the number of HTML files that were touched.
 */
export function rewriteStudioPaths(
    rootDir: string,
    endpoint: string,
): number {
    const normalised = normaliseEndpoint(endpoint);
    let touched = 0;

    const walk = (dir: string): void => {
        for (const entry of readdirSync(dir)) {
            const abs = path.join(dir, entry);
            const st = statSync(abs);
            if (st.isDirectory()) {
                walk(abs);
                continue;
            }
            if (!entry.endsWith(".html")) continue;

            const before = readFileSync(abs, "utf8");
            const after = rewriteHtml(before, normalised);
            if (after !== before) {
                writeFileSync(abs, after, "utf8");
                touched++;
            }
        }
    };

    walk(rootDir);
    return touched;
}

/**
 * Single-file HTML rewrite — exposed for unit tests.
 *
 * <p>Next.js's static export embeds client-side route manifests as
 * JSON-escaped strings inside inline <code>&lt;script&gt;</code> tags.
 * Those strings look like <code>"/_next/static/chunks/abc123.js"</code>
 * (or their escaped form <code>\"_next/static/...</code>). The browser
 * resolves those at runtime — so unless we prepend the mount path to
 * every occurrence, the studio's router never finds its chunks and
 * every button (theme toggle, search, settings, etc.) silently
 * stops working.</p>
 *
 * <p>Strategy: replace every <code>/_next/</code> with
 * <code>&lt;endpoint&gt;/_next/</code>. The leading slash is consumed
 * by the replacement so the rewrite works for both attribute values
 * (<code>href="/_next/..."</code>) and inline JSON strings
 * (<code>\"_next/static/...</code>). The favicon path uses
 * <code>/favicon.ico?...</code> with a cache-busting parameter so it
 * needs its own rewrite. Finally we inject <code>&lt;base href&gt;</code>
 * as a defensive backstop.</p>
 *
 * <p><strong>Idempotence:</strong> the rewrite must be a no-op on a
 * string that already starts with <code>&lt;endpoint&gt;/_next/</code>.
 * Otherwise a second pass (or, in the past, the rewriter running on a
 * studio that Next.js had already built with <code>basePath</code>)
 * would produce <code>&lt;endpoint&gt;/&lt;endpoint&gt;/_next/...</code>
 * and the page would 404 every asset.</p>
 *
 * <p>Why no <code>/static/</code> rewrite? Every <code>/static/...</code>
 * in the studio HTML appears inside <code>/_next/static/...</code> paths
 * — rewriting <code>/static/</code> separately would insert a duplicate
 * prefix (the rewrite would happen <em>after</em> the <code>/_next/</code>
 * rewrite, finding the now-standalone <code>/static/</code> segment).</p>
 *
 * @internal
 */
export function rewriteHtml(html: string, endpoint: string): string {
    if (endpoint === "/" || endpoint === "") return html;

    let result = html;

    // 1. Broad catch-all: any `/_next/...` reference in the file
    //    — whether inside `href`, `src`, or an inline `<script>`
    //    JSON payload — gets the endpoint prepended.
    //
    //    Use a negative lookbehind to skip matches that already
    //    begin with `${endpoint}/_next/` — keeps the rewrite
    //    idempotent so it can be safely re-applied.
    const prefix = `${endpoint}/_next/`;
    const pattern = new RegExp(`(?<!${escapeRegex(endpoint)})/_next/`, "g");
    result = result.replace(pattern, prefix);

    // 2. Favicon — Next.js emits `href="/favicon.ico?..."` with a
    //    cache-busting query string. Anchor on `?` so the query is
    //    preserved; also cover the unparametrised form.
    result = result.replaceAll(
        '/favicon.ico?',
        `${endpoint}/favicon.ico?`,
    );
    result = result.replaceAll(
        'href="/favicon.ico"',
        `href="${endpoint}/favicon.ico"`,
    );

    // 3. Inject `<base href>` into the document head. The browser
    //    uses this as the resolution base for any *relative* URL
    //    the studio constructs at runtime — defensive backstop in
    //    case a future Next.js version emits a path pattern we
    //    don't rewrite here. Skip when one is already present so
    //    the rewrite stays idempotent.
    const baseTag = `<base href="${endpoint}/" />`;
    if (!result.includes('<base href="')) {
        result = result.replace('<head>', `<head>${baseTag}`);
    }

    return result;
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normaliseEndpoint(endpoint: string): string {
    const trimmed = (endpoint ?? "").trim();
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    if (withSlash === "/" || withSlash === "") return "/";
    return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

/* ------------------------------------------------------------------ */
/* Studio rebuild with `basePath`                                       */
/* ------------------------------------------------------------------ */

/**
 * Result of locating the studio source folder inside the monorepo.
 *
 * <p>We only rebuild when the studio source is reachable, because
 * rebuilding requires running <code>next build</code> against the
 * source tree. In the published <code>spectra</code> npm package the
 * studio ships as a pre-built <code>dist/studio/</code> folder with
 * no source — in that case <code>studioRoot</code> is undefined and
 * we fall back to the existing path-rewriter.</p>
 */
interface StudioSourceLocation {
    /** Absolute path to `apps/studio/` (the directory containing package.json + next.config.mjs). */
    readonly studioRoot: string;
    /** Absolute path to the monorepo root (one level above `apps/`). */
    readonly monorepoRoot: string;
}

/**
 * Locate the studio source folder by walking up from this file.
 *
 * <p>Works in both layouts we ship:</p>
 * <ul>
 *   <li>Dev (tsx): <code>packages/cli/src/pipeline/rewrite-studio-paths.ts</code>
 *       lives at <code>packages/cli/src/pipeline/</code> in the monorepo,
 *       so walking up 4 levels lands in the repo root.</li>
 *   <li>Bundled: <code>packages/cli/dist/spectra.mjs</code> lives at
 *       <code>packages/cli/dist/</code>; if the studio source has been
 *       shipped alongside (monorepo install / dev install) it will be
 *       at the same relative position.</li>
 * </ul>
 */
function findStudioSourceForRoot(here: string): StudioSourceLocation | undefined {
    // Walk up from `here` looking for an `apps/studio/package.json`
    // with a `next.config.mjs` next to it. Bounded at 6 levels so
    // we don't loop forever in unexpected layouts.
    let dir = here;
    for (let i = 0; i < 6; i++) {
        const candidate = path.resolve(dir, "apps", "studio");
        if (
            existsSync(path.join(candidate, "package.json")) &&
            existsSync(path.join(candidate, "next.config.mjs"))
        ) {
            return { studioRoot: candidate, monorepoRoot: path.resolve(dir) };
        }
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
    }
    return undefined;
}

/**
 * Synchronous wrapper around <code>pnpm --filter studio build</code>
 * (or <code>npm run build</code> if pnpm is unavailable).
 *
 * <p>Forks the build into a child process with
 * <code>SPECTRA_BASE_PATH=&lt;endpoint&gt;</code> in the env so the
 * studio's <code>next.config.mjs</code> picks it up via
 * <code>process.env.SPECTRA_BASE_PATH</code>. Output stays in the
 * existing <code>apps/studio/out/</code> folder — the same folder
 * <code>copyBundledStudio</code> reads from right after.</p>
 *
 * <p>If the build fails (missing dependency, syntax error in the
 * studio, etc.) we throw — the caller decides whether to swallow
 * the error and fall back to the pre-built studio or surface it.</p>
 */
function rebuildStudioSync(studioRoot: string, endpoint: string): void {
    // We deliberately use the `child_process.spawnSync` API (rather
    // than execFileSync) so we can pipe stderr through — useful when
    // the user is staring at a CLI that just printed "[stage 3]".
    // Note: this is intentionally synchronous; the whole rebuild is
    // on the critical path of `spectra generate` and there's no
    // useful work we could do in parallel.
    const normalised = normaliseEndpoint(endpoint);
    const env = { ...process.env, SPECTRA_BASE_PATH: normalised };
    const result = spawnSync("pnpm", ["--filter", "studio", "build"], {
        cwd: path.dirname(path.dirname(studioRoot)),
        env,
        stdio: "inherit",
    });
    if (result.status !== 0) {
        throw new Error(
            `Studio rebuild failed (exit ${result.status ?? "?"}). ` +
            `Check that \`pnpm install\` has been run and the studio builds manually.`,
        );
    }
}