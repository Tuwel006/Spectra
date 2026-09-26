import { Box } from "./box.js";

export interface ReportInput {
    readonly projectRoot: string;
    readonly destination: string;
    readonly bytesWritten: number;
    readonly stats: {
        readonly pathCount: number;
        readonly operationCount: number;
        readonly schemaCount: number;
    };
    readonly endpoint: string;
    readonly verification:
        | {
              readonly ok: boolean;
              readonly elapsedMs: number;
              readonly error?: string;
          }
        | undefined;
}

export function printReport(
    result: ReportInput,
): void {
    const box = new Box(
        "SPECTRA · BUILD REPORT",
    );

    box.addRow(
        "scan",
        result.projectRoot,
        "ok",
    );

    box.addRow(
        "build",
        `${result.stats.pathCount} paths · ` +
            `${result.stats.operationCount} operations · ` +
            `${result.stats.schemaCount} schemas`,
        "ok",
    );

    box.addRow(
        "format",
        `binary document (${result.bytesWritten} bytes)`,
        "ok",
    );

    box.addRow(
        "write",
        result.destination,
        "ok",
    );

    box.addRow(
        "verify",
        result.verification?.ok
            ? `round-trip OK (${result.verification.elapsedMs} ms)`
            : `FAILED: ${
                  result.verification?.error ??
                  "unknown"
              }`,
        result.verification?.ok
            ? "ok"
            : "fail",
    );

    box.addRow(
        "config",
        `endpoint ${result.endpoint}`,
        "ok",
    );

    box.render();
}