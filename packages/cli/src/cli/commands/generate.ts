import * as path from "node:path";

import {
    formatPipelineSummary,
    buildDocumentationBin,
} from "@spectra/provider-nestjs";

import {
    resolveSpectraBinPath,
    writeSpectraConfig,
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
            await buildDocumentationBin(
                projectRoot,
                {
                    destination:
                        args.destination
                            ? path.resolve(
                                  projectRoot,
                                  args.destination,
                              )
                            : undefined,

                    verify: args.verify,

                    logger: {
                        info: () =>
                            undefined,

                        warn: () =>
                            undefined,

                        error: () =>
                            undefined,
                    },
                },
            );

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

    const configSpinner =
        new Spinner();

    configSpinner.start(
        "Writing Spectra configuration...",
    );

    try {
        await writeSpectraConfig(
            projectRoot,
            {
                endpoint:
                    endpoint.endpoint,
            },
        );

        configSpinner.succeed(
            "Spectra configuration written",
        );
    } catch (error) {
        configSpinner.fail(
            `Config failed: ${
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

    console.log("");

    console.log(
        formatPipelineSummary(
            result,
        ),
    );
}