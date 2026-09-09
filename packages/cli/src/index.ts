#!/usr/bin/env node

import { parseArgs } from "./args/parser.js";
import { runGenerate } from "./commands/generate.js";

async function main(): Promise<void> {
    const args = parseArgs(process.argv.slice(2));

    switch (args.command) {
        case "generate":
            await runGenerate(args.generate!);
            return;

        case "help":
            printHelp();
            return;

        case "version":
            printVersion();
            return;
    }
}

main().catch((error) => {
    console.error(
        `\nSpectra failed: ${error instanceof Error ? error.message : String(error)}`
    );

    process.exit(1);
});