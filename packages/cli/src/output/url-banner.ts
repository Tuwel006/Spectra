/**
 * Next.js-style URL banner printed after a successful run.
 *
 * <p>The CLI doesn't know the user's actual host/port (the user
 * picks those when starting their NestJS server). We surface a
 * common-default banner and copy-able hints so the user can adapt
 * the URL to their environment.</p>
 */

export interface UrlBannerArgs {
    readonly endpoint: string;
    /** Default port the user's NestJS server is expected to run on. */
    readonly port?: number;
}

/**
 * Render a Next.js-style banner announcing where the docs will be
 * served once the user starts their NestJS app. Output is
 * colour-aware (auto-detects TTY).
 */
export function renderUrlBanner(args: UrlBannerArgs): string {
    const port = args.port ?? 3000;
    const host = `http://localhost:${port}`;
    const url = `${host}${args.endpoint}`;

    const useColor = Boolean(process.stdout.isTTY);
    const dim = (s: string): string =>
        useColor ? `\x1b[2m${s}\x1b[0m` : s;
    const bold = (s: string): string =>
        useColor ? `\x1b[1m${s}\x1b[0m` : s;
    const green = (s: string): string =>
        useColor ? `\x1b[32m${s}\x1b[0m` : s;
    const cyan = (s: string): string =>
        useColor ? `\x1b[36m${s}\x1b[0m` : s;

    const line = "─".repeat(58);
    return [
        "",
        dim(line),
        `${green("▲")} ${bold("SPECTRA · ready")}`,
        "",
        `  ${dim("Local:")}  ${cyan(url)}`,
        "",
        `  ${dim("→  Next steps:")}`,
        `  ${dim("1.")} Mount ${cyan("SpectraModule.forRoot({ endpoint: '" + args.endpoint + "' })")}`,
        `     ${dim("in your AppModule.")}`,
        `  ${dim("2.")} Start your NestJS app on port ${port}.`,
        `  ${dim("3.")} Open ${cyan(url)} ${dim("in a browser.")}`,
        dim(line),
        "",
    ].join("\n");
}
