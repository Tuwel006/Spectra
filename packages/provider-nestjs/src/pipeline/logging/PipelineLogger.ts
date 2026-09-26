/**
 * Structured logger interface for the documentation pipeline.
 *
 * <p>The pipeline calls into the logger at every stage boundary so
 * a CLI invocation produces a clear, professional-looking log
 * stream — scan → build → format → write → verify — with each
 * stage prefixed and timestamped.</p>
 *
 * <p>Implementations can be:</p>
 * <ul>
 *   <li>{@link consoleLogger} — default; writes prefixed lines to
 *       stdout/stderr. Used by the CLI.</li>
 *   <li>A silent / no-op logger — used by tests that want to keep
 *       their assertion output clean.</li>
 *   <li>A pino / winston adapter — used when the pipeline runs
 *       inside an existing service that already has a logger.</li>
 * </ul>
 */
export interface PipelineLogger {
    /** Informational message — successful stage transitions. */
    info(stage: string, message: string, meta?: Record<string, unknown>): void;
    /** Warning — recoverable issue (e.g. partial result). */
    warn(stage: string, message: string, meta?: Record<string, unknown>): void;
    /** Error — pipeline failure or stage exception. */
    error(stage: string, message: string, meta?: Record<string, unknown>): void;
}

/**
 * No-op logger. Useful for tests that don't want log noise mixed
 * into their assertion output.
 */
export const silentLogger: PipelineLogger = Object.freeze({
    info: (_stage: string, _message: string, _meta?: Record<string, unknown>): void => undefined,
    warn: (_stage: string, _message: string, _meta?: Record<string, unknown>): void => undefined,
    error: (_stage: string, _message: string, _meta?: Record<string, unknown>): void => undefined,
});

/**
 * Format a single meta record as `key=value` pairs joined by spaces.
 * Stringifies non-string values via `String()` so it's safe to log
 * numbers, booleans, paths, etc. without worrying about `inspect`.
 */
function formatMeta(meta?: Record<string, unknown>): string {
    if (!meta) return "";
    const parts: string[] = [];
    for (const [key, value] of Object.entries(meta)) {
        if (value === undefined) continue;
        parts.push(`${key}=${String(value)}`);
    }
    return parts.length > 0 ? `  ${parts.join(" ")}` : "";
}

/**
 * Console-backed logger. Each line is prefixed with `[spectra]` and
 * the current ISO timestamp (HH:mm:ss precision — microseconds would
 * be noise on a build that takes a few hundred milliseconds).
 *
 * <p>info/warn → stdout. error → stderr. The default Node
 * `console.log` already routes through stdout; `console.error` routes
 * through stderr.</p>
 */
export const consoleLogger: PipelineLogger = Object.freeze({
    info(stage: string, message: string, meta?: Record<string, unknown>): void {
        const line = formatLogLine(stage, message, meta);
        console.log(line);
    },
    warn(stage: string, message: string, meta?: Record<string, unknown>): void {
        const line = formatLogLine(stage, message, meta);
        console.warn(line);
    },
    error(stage: string, message: string, meta?: Record<string, unknown>): void {
        const line = formatLogLine(stage, message, meta);
        console.error(line);
    },
});

function formatLogLine(
    stage: string,
    message: string,
    meta?: Record<string, unknown>,
): string {
    const ts = new Date().toISOString().slice(11, 19);
    return `[spectra] ${ts}  ${stage.padEnd(8)}  ${message}${formatMeta(meta)}`;
}
