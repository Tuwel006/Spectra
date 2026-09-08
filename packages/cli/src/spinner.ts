/**
 * Spinner — a no-dependency terminal spinner that fits inside a
 * single text row. Drives an animation by writing `\r` sequences
 * back to stdout so the output stays in place while running.
 *
 * <p>Used by the CLI to animate long-running stages (scan / build
 * / format / write / verify) without flickering the user's
 * terminal.</p>
 */

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const ANSI = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
} as const;

/** Tick interval for the spinner animation (ms). */
const SPINNER_INTERVAL_MS = 80;

export interface SpinnerOptions {
    /** Prefix text rendered before the spinner glyph (e.g. "scan"). */
    readonly label?: string;
    /** Disable ANSI color codes (auto-detected from TTY). */
    readonly noColor?: boolean;
}

export class Spinner {
    private interval: NodeJS.Timeout | null = null;
    private frame = 0;
    private currentMessage = "";
    private readonly label: string;
    private readonly useColor: boolean;

    public constructor(options: SpinnerOptions = {}) {
        this.label = options.label ?? "";
        this.useColor =
            options.noColor !== undefined
                ? !options.noColor
                : Boolean(process.stdout.isTTY);
    }

    /** Start the spinner with an initial message. */
    public start(message: string): void {
        this.currentMessage = message;
        this.frame = 0;
        if (this.interval !== null) return;

        this.render();
        this.interval = setInterval(() => {
            this.frame = (this.frame + 1) % SPINNER_FRAMES.length;
            this.render();
        }, SPINNER_INTERVAL_MS);
    }

    /** Update the spinner message mid-spin. */
    public update(message: string): void {
        this.currentMessage = message;
        this.render();
    }

    /** Stop the spinner with a success message (green ✓). */
    public succeed(message: string): void {
        this.stop();
        console.log(this.format("✓", "green", message));
    }

    /** Stop the spinner with a warning message (yellow ⚠). */
    public warn(message: string): void {
        this.stop();
        console.log(this.format("⚠", "yellow", message));
    }

    /** Stop the spinner with a failure message (red ✗). */
    public fail(message: string): void {
        this.stop();
        console.log(this.format("✗", "red", message));
    }

    /** Stop the spinner without printing anything. */
    public stop(): void {
        if (this.interval !== null) {
            clearInterval(this.interval);
            this.interval = null;
        }
        // Clear the spinner line so the next output starts cleanly.
        if (process.stdout.isTTY) {
            process.stdout.write("\r\x1b[2K");
        }
    }

    private render(): void {
        if (!process.stdout.isTTY) {
            // No TTY — print the message without animation so output
            // stays readable when piped to a file.
            console.log(this.formatPlain(this.currentMessage));
            return;
        }
        const glyph = SPINNER_FRAMES[this.frame] ?? "·";
        const labelPart = this.label
            ? `${this.color("cyan", this.label.padEnd(8))} `
            : "";
        process.stdout.write(`\r\x1b[2K${labelPart}${this.color("cyan", glyph)} ${this.currentMessage}`);
    }

    private format(glyph: string, color: keyof typeof ANSI, message: string): string {
        const labelPart = this.label
            ? `${this.color("cyan", this.label.padEnd(8))} `
            : "";
        return `${labelPart}${this.color(color, glyph)} ${message}`;
    }

    private formatPlain(message: string): string {
        const labelPart = this.label ? `${this.label.padEnd(8)} ` : "";
        return `${labelPart}· ${message}`;
    }

    private color(name: keyof typeof ANSI, text: string): string {
        if (!this.useColor) return text;
        return `${ANSI[name]}${text}${ANSI.reset}`;
    }
}

/**
 * Box — render a labelled box around a multi-line body, suitable for
 * the CLI's progress dashboard. Auto-detects TTY for ANSI styling.
 *
 * <pre>
 * ┌─ SPECTRA ─────────────────────────────────┐
 * │ scan   Scanning project at /path/...      │
 * │ build  Built 14 paths / 18 operations     │
 * │ verify Round-trip OK                      │
 * └───────────────────────────────────────────┘
 * </pre>
 */
export class Box {
    private readonly width: number;
    private readonly useColor: boolean;
    private readonly rows: { stage: string; message: string; status: BoxStatus }[] = [];
    private readonly title: string;

    public constructor(title: string, width = 64) {
        this.title = title;
        this.width = Math.max(40, width);
        this.useColor = Boolean(process.stdout.isTTY);
    }

    public addRow(stage: string, message: string, status: BoxStatus = "pending"): this {
        this.rows.push({ stage, message, status });
        return this;
    }

    public render(): void {
        const lines: string[] = [];
        lines.push(this.border("┌", "─", "┐", ` ${this.title} `));
        for (const row of this.rows) {
            lines.push(this.rowLine(row));
        }
        lines.push(this.border("└", "─", "┘", ""));
        console.log(lines.join("\n"));
    }

    private rowLine(row: { stage: string; message: string; status: BoxStatus }): string {
        const stageText = row.stage.padEnd(8);
        const glyph = boxStatusGlyph(row.status);
        const glyphText = this.colorize(boxStatusColor(row.status), glyph);
        const body = `${glyphText} ${this.colorize("cyan", stageText)} ${row.message}`;
        const padding = Math.max(1, this.width - stripAnsi(body).length - 2);
        return `│ ${body}${" ".repeat(padding)} │`;
    }

    private border(left: string, fill: string, right: string, title: string): string {
        const titleLen = stripAnsi(title).length;
        const remaining = Math.max(0, this.width - titleLen - 2);
        const head = title ? `${left}${fill} ${title}${fill.repeat(remaining)}${right}` : `${left}${fill.repeat(this.width)}${right}`;
        return head;
    }

    private colorize(name: keyof typeof ANSI, text: string): string {
        if (!this.useColor) return text;
        return `${ANSI[name]}${text}${ANSI.reset}`;
    }
}

type BoxStatus = "pending" | "running" | "ok" | "warn" | "fail";

function boxStatusGlyph(status: BoxStatus): string {
    switch (status) {
        case "pending":
            return "○";
        case "running":
            return "⠋";
        case "ok":
            return "✓";
        case "warn":
            return "⚠";
        case "fail":
            return "✗";
    }
}

function boxStatusColor(status: BoxStatus): keyof typeof ANSI {
    switch (status) {
        case "pending":
            return "gray";
        case "running":
            return "cyan";
        case "ok":
            return "green";
        case "warn":
            return "yellow";
        case "fail":
            return "red";
    }
}

function stripAnsi(s: string): string {
    // eslint-disable-next-line no-control-regex
    return s.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Color helpers exposed for the rest of the CLI.
 */
export const colors = ANSI;
export { stripAnsi };
