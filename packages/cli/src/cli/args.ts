export interface CliArgs {
    readonly command: string | undefined;
    readonly verify: boolean;
    readonly json: boolean;
    readonly destination: string | undefined;
    readonly endpointExplicit: string | undefined;
    readonly endpointAuto: boolean;
}

export function parseArgs(argv: readonly string[]): CliArgs {
    let command: string | undefined;
    let verify = true;
    let json = false;
    let destination: string | undefined;
    let endpointExplicit: string | undefined;
    let endpointAuto = false;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]!;

        if (!command && !arg.startsWith("-")) {
            command = arg;
            continue;
        }

        switch (arg) {
            case "--no-verify":
                verify = false;
                break;

            case "--json":
                json = true;
                break;

            case "--out":
            case "-o": {
                const value = argv[++i];

                if (!value || value.startsWith("-")) {
                    throw new Error(`${arg} requires a destination path`);
                }

                destination = value;
                break;
            }

            case "--endpoint":
            case "-e": {
                const next = argv[i + 1];

                if (next && !next.startsWith("-")) {
                    endpointExplicit = next;
                    i++;
                } else {
                    endpointAuto = true;
                }

                break;
            }

            case "--help":
            case "-h":
                return {
                    command: "help",
                    verify,
                    json,
                    destination,
                    endpointExplicit,
                    endpointAuto,
                };

            default:
                throw new Error(`Unknown argument: ${arg}`);
        }
    }

    return {
        command,
        verify,
        json,
        destination,
        endpointExplicit,
        endpointAuto,
    };
}