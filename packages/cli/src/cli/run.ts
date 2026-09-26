import {
    parseArgs,
} from "./args.js";

import {
    printHelp,
} from "./help.js";

import {
    runGenerate,
} from "./commands/generate.js";

export async function runCli(
    argv: readonly string[],
): Promise<void> {
    const args =
        parseArgs(argv);

    if (
        !args.command ||
        args.command === "help"
    ) {
        printHelp();
        return;
    }

    switch (args.command) {
        case "generate":
            await runGenerate(args);
            return;

        default:
            throw new Error(
                `Unknown command: ${args.command}`,
            );
    }
}