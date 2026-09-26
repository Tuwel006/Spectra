import { Controller, Get, Header, Param, Res } from "@nestjs/common";
import type { Response } from "express";

import { SpectraStaticFilesService } from "./static-files.service.js";

/**
 * Public HTTP surface of the {@link SpectraModule}.
 *
 * <p>Beginner-friendly route map (everything is mounted under the
 * configured endpoint, e.g. <code>/spectra</code>):</p>
 *
 * <pre>
 *   GET /spectra/document.bin    → the encoded documentation
 *   GET /spectra/config.json     → the spectra config (endpoint, etc.)
 * </pre>
 *
 * <p>The static studio HTML/JS/CSS is served by
 * {@link ServeStaticModule} mounted at the same endpoint — see
 * {@link SpectraModule}. The encoded binary file is intentionally
 * served as-is. The studio fetches it client-side and decodes
 * msgpack + gzip in the browser — no server roundtrip needed.</p>
 */
@Controller()
export class SpectraController {
    public constructor(
        private readonly staticFiles: SpectraStaticFilesService,
    ) {}

    /**
     * Serves `document.bin`. Sets a modest max-age because the
     * document only changes when the user re-runs `spectra generate`.
     */
    @Get(":endpoint/document.bin")
    @Header("Content-Type", "application/octet-stream")
    @Header("Cache-Control", "public, max-age=300")
    public async getDocumentBin(
        @Param("endpoint") _endpoint: string,
        @Res() res: Response,
    ): Promise<void> {
        const buf = await this.staticFiles.read("../../../document.bin");
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
     * Serves the `.spectra/config.json` next to the encoded doc.
     * The studio reads this to learn its own endpoint path.
     */
    @Get(":endpoint/config.json")
    @Header("Content-Type", "application/json")
    public async getConfig(
        @Param("endpoint") _endpoint: string,
        @Res() res: Response,
    ): Promise<void> {
        const buf = await this.staticFiles.read("../../../config.json");
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
