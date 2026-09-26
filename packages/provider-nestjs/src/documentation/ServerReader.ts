import type { Server } from "@spectra/core";

import type { SpectraConfig } from "../config/SpectraConfig";

/**
 * G1 — ServerReader.
 *
 * Produces the `Server[]` portion of the `Documentation` model from
 * a fully-merged `SpectraConfig`. The `SpectraConfig.servers` field
 * is populated only when the user has explicitly configured servers
 * via `spectra.config.json`. If the user did not configure any
 * server, the resulting `Server[]` is empty (`[]`). We do NOT
 * invent `http://localhost:3000` or any other URL.
 *
 * Each emitted `Server.id` is a deterministic slug derived from the
 * configured URL so that re-builds produce stable ids.
 */
export class ServerReader {
    public read(config: SpectraConfig): Server[] {
        return config.servers.map((s, i) => ({
            id: this.serverId(s.url, i),
            url: s.url,
            description: s.description,
        }));
    }

    private serverId(url: string, index: number): string {
        const safe = url
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `server-${safe || String(index)}`;
    }
}
