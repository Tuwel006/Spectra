import {
    DynamicModule,
    MiddlewareConsumer,
    Module,
    NestModule,
} from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "node:path";

import { SpectraStaticFilesService } from "./static-files.service.js";
import { SpectraController } from "./spectra.controller.js";
import { SPECTRA_OPTIONS, spectraProviders } from "./spectra.constants.js";

/**
 * Configuration accepted by {@link SpectraModule.forRoot}.
 *
 * <p>Beginner-friendly: an options object is the standard NestJS
 * pattern (look up `forRoot` / `forFeature`). It lets the module be
 * globally configured once, then injected wherever needed.</p>
 */
export interface SpectraModuleOptions {
    /** HTTP path the studio + endpoints are mounted under. */
    readonly endpoint: string;
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
 * <p>Beginner-friendly usage:</p>
 *
 * <pre>
 * import { Module } from "@nestjs/common";
 * import { SpectraModule } from "@spectra/runtime";
 *
 * &#64;Module({
 *   imports: [SpectraModule.forRoot({ endpoint: "/spectra" })],
 * })
 * export class AppModule {}
 * </pre>
 *
 * <p>After the app boots, opening <code>http://localhost:3000/spectra</code>
 * in a browser shows the docs studio with your decoded API surface.</p>
 */
@Module({
    providers: [SpectraStaticFilesService],
    controllers: [SpectraController],
})
export class SpectraModule implements NestModule {
    public static forRoot(
        options: SpectraModuleOptions,
    ): DynamicModule {
        const projectRoot =
            options.projectRoot ?? process.cwd();

        return {
            module: SpectraModule,
            imports: [
                // serve-static mounts a directory at a path. We point
                // it at <projectRoot>/.spectra/studio (created by
                // `spectra generate`) so the studio is served with
                // zero custom code on the user's side.
                ServeStaticModule.forRoot({
                    serveRoot: path.join(
                        projectRoot,
                        ".spectra",
                        "studio",
                    ),
                    serveStaticOptions: {
                        // SPA mode — any unknown path under the
                        // studio returns index.html so the React
                        // router can take over (404 fallthrough).
                        fallthrough: true,
                    },
                }),
            ],
            providers: spectraProviders(projectRoot),
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
