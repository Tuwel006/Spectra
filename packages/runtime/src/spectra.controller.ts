import {
    Controller,
    Get,
    Header,
    Res,
    type Type,
} from "@nestjs/common";
import type { Response } from "express";

import { SpectraStaticFilesService } from "./static-files.service.js";

/**
 * Public HTTP surface of the {@link SpectraModule}.
 *
 * <p>The controller is built dynamically per module so that the
 * configured <code>endpoint</code> (e.g. <code>/my-docs</code>) becomes
 * a real URL prefix — every route the studio needs lives under that
 * prefix, so a Spectra instance mounted at one path can never
 * accidentally serve under another.</p>
 *
 * <p>Beginner-friendly route map (mounted at the configured endpoint,
 * e.g. <code>/my-docs</code>):</p>
 *
 * <pre>
 *   GET /my-docs/             → studio HTML (handled by serve-static)
 *   GET /my-docs/document.bin → the encoded documentation
 *   GET /my-docs/config.json  → the spectra config (endpoint, …)
 * </pre>
 *
 * <p>The static studio HTML / JS / CSS is served by
 * {@link ServeStaticModule} mounted at the same endpoint. The encoded
 * binary file is intentionally served as-is — the studio fetches it
 * client-side and decodes msgpack + gzip in the browser.</p>
 */
export interface SpectraControllerInstance {
    readonly staticFiles: SpectraStaticFilesService;
}

/**
 * Build a controller class bound to a specific endpoint prefix.
 *
 * <p>Why a factory rather than a static class? Because NestJS's
 * <code>@Controller(prefix)</code> is a class-level decorator — the
 * prefix has to exist at class-definition time, not at request time.
 * A factory lets each <code>SpectraModule.forRoot({ endpoint })</code>
 * call materialise its own controller with the user's prefix
 * baked into the route table.</p>
 *
 * @param endpoint URL prefix where the studio + bin + config live.
 *                 Must start with <code>/</code>.
 */
export function makeSpectraController(endpoint: string): Type<SpectraControllerInstance> {
    const prefix = normalizeEndpoint(endpoint);

    @Controller(prefix)
    class SpectraController implements SpectraControllerInstance {
        public constructor(
            public readonly staticFiles: SpectraStaticFilesService,
        ) {}

        /**
         * Serves <code>document.bin</code>. Sets a modest max-age
         * because the document only changes when the user re-runs
         * <code>spectra generate</code>.
         */
        @Get("document.bin")
        @Header("Content-Type", "application/octet-stream")
        @Header("Cache-Control", "public, max-age=300")
        public async getDocumentBin(
            @Res() res: Response,
        ): Promise<void> {
            const buf = await this.staticFiles.read("../document.bin");
            if (!buf) {
                res.status(404).json({
                    error: "Spectra document not found",
                    hint: "Run `spectra generate` first.",
                });
                return;
            }
            res.send(buf);
        }

        /**
         * Serves the <code>.spectra/config.json</code> next to the
         * encoded doc. The studio reads this to learn its own
         * endpoint path.
         */
        @Get("config.json")
        @Header("Content-Type", "application/json")
        public async getConfig(
            @Res() res: Response,
        ): Promise<void> {
            const buf = await this.staticFiles.read("../config.json");
            if (!buf) {
                res.status(404).json({
                    error: "Spectra config not found",
                    hint: "Run `spectra generate` first.",
                });
                return;
            }
            res.send(buf);
        }
    }

    return SpectraController;
}

/**
 * Normalize an endpoint string into a URL prefix suitable for
 * <code>@Controller()</code> and <code>ServeStaticModule.serveRoot</code>.
 *
 * <p>Rules:</p>
 * <ul>
 *   <li>Must start with <code>/</code> — leading slash is added if missing.</li>
 *   <li>Trailing slash is stripped (NestJS concatenates with the
 *       <code>@Get()</code> path).</li>
 *   <li>Empty / whitespace input falls back to <code>/spectra</code>.</li>
 * </ul>
 */
function normalizeEndpoint(endpoint: string): string {
    const trimmed = (endpoint ?? "").trim();
    const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    if (withSlash === "/" || withSlash === "") return "/spectra";
    return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}