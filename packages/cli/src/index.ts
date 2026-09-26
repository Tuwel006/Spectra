#!/usr/bin/env node

import {
    runCli,
} from "./cli/run.js";

runCli(
    process.argv.slice(2),
).catch((error) => {
    console.error(
        `\nSpectra failed: ${
            error instanceof Error
                ? error.message
                : String(error)
        }`,
    );

    process.exit(1);
});