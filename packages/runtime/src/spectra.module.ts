import {
    DynamicModule,
    MiddlewareConsumer,
    Module,
    NestModule,
} from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";

import { SpectraStaticFilesService } from "./static-files.service.js";
import { makeSpectraController } from "./spectra.controller.js";
import { SPECTRA_OPTIONS, spectraProviders } from "./spectra.constants.js";

/**
 * Configuration accepted by {@link SpectraModule.forRoot}.
 *
 * <p>The module is designed to require the bare minimum: usually
 * you just call <code>SpectraModule.forRoot()</code> and it figures
 * out the rest from <code>.spectra/config.json</code> (written by
 * <code>spectra generate</code>).</p>
 */
export interface SpectraModuleOptions {
    /**
     * HTTP path the studio + endpoints are mounted under.
     *
     * <p>Three modes:</p>
     * <ul>
     *   <li><strong>omitted / <code>"auto"</code></strong> — read
     *       <code>endpoint</code> from <code>.spectra/config.json</code>.
     *       This is what you want in 99% of cases: the CLI writes the
     *       endpoint when it generates the documentation, and the
     *       runtime picks it up at boot.</li>
     *   <li><strong>explicit string</strong> — overrides
     *       <code>config.json</code>. Useful when you want the studio
     *       at a different URL than the bin/config file say (e.g.
     *       behind a reverse proxy that strips a prefix).</li>
     *   <li><strong>fallback</strong> — if <code>config.json</code>
     *       is missing or unreadable, the module falls back to
     *       <code>/spectra</code>.</li>
     * </ul>
     *
     * <p>Examples:</p>
     * <pre>
     *   "/spectra"        → studio at http://host:port/spectra
     *   "/my-docs"        → studio at http://host:port/my-docs
     *   "api-explorer"    → auto-prefixed with /
     * </pre>
     */
    readonly endpoint?: string;
    /**
     * Absolute path of the project whose `.spectra/` directory we
     * should serve. Defaults to `process.cwd()`.
     */
    readonly projectRoot?: string;
}

/**
 * SpectraModule — drop into any NestJS application to expose the
 * studio + document.bin at the configured endpoint.
 *
 * <p>Beginner-friendly usage (the typical case):</p>
 *
 * <pre>
 * import { Module } from "@nestjs/common";
 * import { SpectraModule } from "@spectra/runtime";
 *
 * &#64;Module({
 *   imports: [SpectraModule.forRoot()],
 * })
 * export class AppModule {}
 * </pre>
 *
 * <p>After the app boots, the studio is served at whatever path the
 * CLI wrote into <code>.spectra/config.json</code>. So if you ran
 * <code>spectra generate --endpoint /my-docs</code>, the studio is
 * at <code>http://localhost:3000/my-docs</code> — no extra config
 * needed.</p>
 */
@Module({
    providers: [SpectraStaticFilesService],
})
export class SpectraModule implements NestModule {
    public static forRoot(
        options: SpectraModuleOptions = {},
    ): DynamicModule {
        const projectRoot =
            options.projectRoot ?? process.cwd();

        // Resolve the mount path. In auto mode (the default) we read
        // it from .spectra/config.json so the user only has to run
        // `spectra generate --endpoint /foo` once — the runtime
        // discovers "/foo" at boot and the studio shows up there.
        const endpoint = resolveEndpoint(options.endpoint, projectRoot);

        // Build a controller class bound to the resolved endpoint.
        // The prefix is baked into the class at definition time, so
        // NestJS's route table already knows where these routes
        // belong — no global app.setGlobalPrefix() gymnastics.
        const SpectraController = makeSpectraController(endpoint);

        return {
            module: SpectraModule,
            controllers: [SpectraController],
            imports: [
                // serve-static mounts a directory at a URL prefix.
                //
                //   rootPath   = absolute filesystem path to serve from
                //   serveRoot  = URL prefix those files become reachable at
                //
                // The CLI populates `<rootPath>` via `spectra generate`
                // — it copies apps/studio/out/ into .spectra/studio/.
                ServeStaticModule.forRoot({
                    rootPath: path.join(
                        projectRoot,
                        ".spectra",
                        "studio",
                    ),
                    serveRoot: endpoint,
                    serveStaticOptions: {
                        // SPA mode — any unknown path under the
                        // studio returns index.html so the React
                        // router can take over (404 fallthrough).
                        fallthrough: true,
                    },
                }),
            ],
            providers: spectraProviders(projectRoot, endpoint),
            exports: [SpectraStaticFilesService],
        };
    }

    /**
     * NestJS lifecycle hook — runs once at app boot. Reserved for
     * future async initialisation (e.g. warming the doc cache).
     */
    public configure(consumer: MiddlewareConsumer): void {
        void consumer;
    }
}

export { SPECTRA_OPTIONS };

/**
 * Resolve the final mount path for the studio.
 *
 * <p>Resolution order:</p>
 * <ol>
 *   <li>If <code>override</code> is a non-empty string other than
 *       <code>"auto"</code>, normalise and return it.</li>
 *   <li>Otherwise, read <code>.spectra/config.json</code> from
 *       <code>projectRoot</code> and use its <code>endpoint</code>
 *       field.</li>
 *   <li>Fallback: <code>/spectra</code>.</li>
 * </ol>
 */
function resolveEndpoint(
    override: string | undefined,
    projectRoot: string,
): string {
    if (
        typeof override === "string" &&
        override.length > 0 &&
        override !== "auto"
    ) {
        return normaliseServeRoot(override);
    }

    const cfgPath = path.join(projectRoot, ".spectra", "config.json");
    if (existsSync(cfgPath)) {
        try {
            const raw = readFileSync(cfgPath, "utf8");
            const parsed = JSON.parse(raw) as { endpoint?: unknown };
            if (typeof parsed.endpoint === "string" && parsed.endpoint.length > 0) {
                return normaliseServeRoot(parsed.endpoint);
            }
        } catch {
            /* corrupt config.json, fall through */
        }
    }

    return normaliseServeRoot("/spectra");
}

/**
 * Normalise an endpoint string into a URL prefix suitable for
 * <code>@Controller()</code> and <code>ServeStaticModule.serveRoot</code>.
 *
 * <p>Rules:</p>
 * <ul>
 *   <li>Adds leading <code>/</code> if missing.</li>
 *   <li>Strips trailing slash (NestJS concatenates with the
 *       <code>@Get()</code> path).</li>
 *   <li>Empty / whitespace input falls back to <code>/spectra</code>.</li>
 * </ul>
 */
function normaliseServeRoot(endpoint: string): string {
    const trimmed = (endpoint ?? "").trim();
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    if (withSlash === "/" || withSlash === "") return "/spectra";
    return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}