import { Inject, Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import * as path from "node:path";

import { SPECTRA_PROJECT_ROOT } from "./spectra.constants.js";

/**
 * Resolves — and lazily reads — the studio's static asset path
 * inside a Spectra project root.
 *
 * <p>Beginner-friendly note on lazy loading:</p>
 *
 * <p>The studio is just static files (HTML / JS / CSS) that the CLI
 * copies into <code>&lt;projectRoot&gt;/.spectra/studio/</code>. We
 * don't want to load all the bytes at module-import time because
 * that's expensive and we want the user's app to start quickly. So
 * the controller reads them on first request and caches them in
 * memory for the lifetime of the server.</p>
 *
 * <p>The "studio root" can be either a directory or a single
 * zip file — the runtime supports both so the CLI can ship the
 * studio either unpacked or as a single <code>.zip</code> file.</p>
 */
@Injectable()
export class SpectraStaticFilesService {
    private cachedPaths: { indexHtml: string; assetsRoot: string } | undefined;

    public constructor(
        @Inject(SPECTRA_PROJECT_ROOT)
        private readonly projectRoot: string,
    ) {}

    /**
     * Absolute path to the studio's <code>index.html</code>.
     *
     * <p>Returns the path even if the file doesn't exist — the
     * controller uses that to surface a friendly "did you run
     * <code>spectra generate</code>?" error instead of a generic
     * 500.</p>
     */
    public async resolveIndexHtml(): Promise<string> {
        const { assetsRoot } = await this.resolveAssetsRoot();
        return path.join(assetsRoot, "index.html");
    }

    /**
     * The directory the controller should pass to
     * <code>useStaticAssets</code>.
     */
    public async resolveAssetsRoot(): Promise<{ assetsRoot: string }> {
        if (this.cachedPaths) {
            return { assetsRoot: this.cachedPaths.assetsRoot };
        }
        const studioDir = path.join(this.projectRoot, ".spectra", "studio");
        const studioZip = path.join(this.projectRoot, ".spectra", "studio.zip");
        if (existsSync(studioDir)) {
            this.cachedPaths = { indexHtml: path.join(studioDir, "index.html"), assetsRoot: studioDir };
        } else if (existsSync(studioZip)) {
            const extracted = studioZip.replace(/\.zip$/, ".extracted");
            this.cachedPaths = { indexHtml: path.join(extracted, "index.html"), assetsRoot: extracted };
        } else {
            this.cachedPaths = { indexHtml: path.join(studioDir, "index.html"), assetsRoot: studioDir };
        }
        return { assetsRoot: this.cachedPaths.assetsRoot };
    }

    /**
     * Reads a file from the studio and returns its content as a
     * buffer. Used by the controller when serving uncommon asset
     * paths that <code>useStaticAssets</code> doesn't cover.
     */
    public async read(assetRelativePath: string): Promise<Buffer | null> {
        const { assetsRoot } = await this.resolveAssetsRoot();
        const target = path.join(assetsRoot, assetRelativePath);
        if (!existsSync(target)) return null;
        return readFile(target);
    }
}
