const FRAMES = [
    "⠋",
    "⠙",
    "⠹",
    "⠸",
    "⠼",
    "⠴",
    "⠦",
    "⠧",
    "⠇",
    "⠏",
];

export class Spinner {
    private timer: NodeJS.Timeout | undefined;
    private frame = 0;
    private message = "";

    public start(message: string): void {
        this.message = message;
        this.frame = 0;

        if (!process.stdout.isTTY) {
            console.log(`· ${message}`);
            return;
        }

        this.render();

        this.timer = setInterval(() => {
            this.frame =
                (this.frame + 1) % FRAMES.length;

            this.render();
        }, 80);
    }

    public update(message: string): void {
        this.message = message;

        if (process.stdout.isTTY) {
            this.render();
        }
    }

    public succeed(message: string): void {
        this.stop();
        console.log(`✓ ${message}`);
    }

    public fail(message: string): void {
        this.stop();
        console.error(`✗ ${message}`);
    }

    public stop(): void {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }

        if (process.stdout.isTTY) {
            process.stdout.write("\r\x1b[2K");
        }
    }

    private render(): void {
        if (!process.stdout.isTTY) {
            return;
        }

        const glyph = FRAMES[this.frame] ?? "·";

        process.stdout.write(
            `\r\x1b[2K${glyph} ${this.message}`,
        );
    }
}