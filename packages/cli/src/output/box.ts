export type BoxStatus =
    | "pending"
    | "running"
    | "ok"
    | "warn"
    | "fail";

interface BoxRow {
    readonly stage: string;
    readonly message: string;
    readonly status: BoxStatus;
}

export class Box {
    private readonly rows: BoxRow[] = [];

    public constructor(
        private readonly title: string,
        private readonly width = 68,
    ) {}

    public addRow(
        stage: string,
        message: string,
        status: BoxStatus = "pending",
    ): this {
        this.rows.push({
            stage,
            message,
            status,
        });

        return this;
    }

    public render(): void {
        console.log("");
        console.log(`┌─ ${this.title} ${"─".repeat(
            Math.max(
                1,
                this.width - this.title.length - 4,
            ),
        )}┐`);

        for (const row of this.rows) {
            const icon = this.icon(row.status);

            const content =
                `${icon} ${row.stage.padEnd(8)} ${row.message}`;

            console.log(
                `│ ${content.padEnd(this.width - 2)} │`,
            );
        }

        console.log(
            `└${"─".repeat(this.width)}┘`,
        );
    }

    private icon(status: BoxStatus): string {
        switch (status) {
            case "ok":
                return "✓";

            case "warn":
                return "⚠";

            case "fail":
                return "✗";

            case "running":
                return "⠋";

            default:
                return "○";
        }
    }
}