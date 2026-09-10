import * as path from "node:path";

import {
    resolveSpectraBinPath,
} from "@spectra/core/encoding";

import {
    resolveEndpoint,
} from "../../config/endpoint.js";

import {
    Spinner,
} from "../../output/spinner.js";

import {
    printReport,
} from "../../output/report.js";

import {
    printJson,
} from "../../output/json.js";

import {
    renderUrlBanner,
} from "../../output/url-banner.js";

import {
    generateDocument,
} from "../../pipeline/generate-document.js";

import type {
    CliArgs,
} from "../args.js";

export async function runGenerate(
    args: CliArgs,
): Promise<void> {
    const projectRoot =
        process.cwd();

    const endpoint =
        await resolveEndpoint({
            explicit:
                args.endpointExplicit,

            autoGenerate:
                args.endpointAuto,

            projectRoot,
        });

    const spinner =
        new Spinner();

    if (!args.json) {
        console.log("");
        console.log(
            "  SPECTRA · GENERATE",
        );
        console.log("");
        console.log(
            `  project root  ${projectRoot}`,
        );
        console.log(
            `  output        ${resolveSpectraBinPath(
                projectRoot,
            )}`,
        );
        console.log(
            `  endpoint      ${endpoint.endpoint}`,
        );
        console.log("");
    }

    spinner.start(
        "Scanning project...",
    );

    let result;

    try {
        result =
            await generateDocument({
                projectRoot,
                endpoint:
                    endpoint.endpoint,
                endpointSource:
                    endpoint.source,
                destination:
                    args.destination
                        ? path.resolve(
                              projectRoot,
                              args.destination,
                          )
                        : undefined,
                verify: args.verify,
                callerUrl: import.meta.url,
            });

        spinner.succeed(
            `Documentation generated in ${result.elapsedMs} ms`,
        );
    } catch (error) {
        spinner.fail(
            `Generation failed: ${
                error instanceof Error
                    ? error.message
                    : String(error)
            }`,
        );

        throw error;
    }

    if (args.json) {
        printJson({
            projectRoot,
            destination:
                result.destination,
            bytesWritten:
                result.bytesWritten,
            elapsedMs:
                result.elapsedMs,
            stats:
                result.stats,
            endpoint:
                endpoint.endpoint,
            endpointSource:
                endpoint.source,
            verification:
                result.verification
                    ? {
                          ok:
                              result
                                  .verification
                                  .ok,

                          error:
                              result
                                  .verification
                                  .error,

                          elapsedMs:
                              result
                                  .verification
                                  .elapsedMs,
                      }
                    : undefined,
        });

        return;
    }

    printReport({
        projectRoot,
        destination:
            result.destination,
        bytesWritten:
            result.bytesWritten,
        stats:
            result.stats,
        endpoint:
            endpoint.endpoint,
        verification:
            result.verification,
    });

    // Print the Next.js-style URL banner telling the user where the
    // studio will be served. The port defaults to 3000 — the user
    // can copy/paste the snippet into their AppModule.
    console.log(
        renderUrlBanner({
            endpoint: endpoint.endpoint,
            port: 3000,
        }),
    );
}
