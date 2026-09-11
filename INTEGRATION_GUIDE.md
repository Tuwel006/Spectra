# Spectra — Full Integration Guide

> A complete, beginner-friendly walkthrough of every package, every
> file, and every line of code that makes the `@spectra/cli` →
> `@spectra/runtime` → Studio → `document.bin` flow work.

This guide tells the story in the same order the work was done: the
build-time CLI, the runtime NestJS module, the static studio
frontend, the client-side decoder, the localStorage edit buffer, and
the Save / Reset / Export UI. Every file gets a section explaining
**what problem it solves**, **how it does it**, and **a beginner-friendly
walk-through of the code**.

---

## Table of contents

1. [The big picture](#the-big-picture)
2. [Step 1 — `@spectra/runtime` NestJS module](#step-1--spectraruntime-nestjs-module)
3. [Step 2 — Make studio exportable as static HTML](#step-2--make-studio-exportable-as-static-html)
4. [Step 3 — Bundle studio into CLI](#step-3--bundle-studio-into-cli)
5. [Step 4 — Next.js-style URL banner](#step-4--nextjs-style-url-banner)
6. [Step 5 — Client-side `document.bin` decoder](#step-5--client-side-documentbin-decoder)
7. [Step 6 — localStorage edit buffer](#step-6--localstorage-edit-buffer)
8. [Step 7 — Save / Reset / Export UI](#step-7--save--reset--export-ui)
9. [End-to-end verification](#end-to-end-verification)
10. [Commits](#commits)

---

## The big picture

```
┌─────────────────────────────────────────────────────────────────┐
│  1. BUILD-TIME (spectra generate)                               │
│     Scans a NestJS project and writes:                           │
│       .spectra/document.bin       ← encoded Documentation     │
│       .spectra/config.json        ← endpoint / metadata        │
│       .spectra/studio/            ← static studio bundle       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. RUNTIME (@spectra/runtime) — user's NestJS app            │
│     SpectraModule.forRoot({ endpoint: '/spectra' })             │
│     Mounts an HTTP endpoint that serves:                        │
│       GET /spectra              → studio HTML/CSS/JS          │
│       GET /spectra/document.bin → encoded docs (msgpack+gzip) │
│       GET /spectra/config.json  → runtime config              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. STUDIO UX (browser)                                        │
│     On load: fetch document.bin, decode client-side             │
│     Cache decoded value in localStorage (edit buffer)           │
│     Save → localStorage   ·   Reset → refetch   ·   Export → JSON│
└─────────────────────────────────────────────────────────────────┘
```

**The single most important rule**:

> `document.bin` is the **source of truth**. localStorage is a
> browser cache. The CLI never writes to localStorage; the studio
> never writes to `document.bin`. Editing the documentation requires
> re-running `spectra generate` upstream.

---

## Step 1 — `@spectra/runtime` NestJS module

### Problem

Without this, every user would need to write Express handlers
themselves to serve `.spectra/`. We want one line of integration:

```ts
@Module({
  imports: [SpectraModule.forRoot({ endpoint: "/spectra" })],
})
export class AppModule {}
```

### Solution

A NestJS dynamic module (`forRoot()` pattern) that:

- Mounts the studio via `ServeStaticModule` at the configured endpoint
- Exposes a controller with `GET <endpoint>/document.bin` and `GET <endpoint>/config.json`
- Lazily reads files on first request (so the user's app boots fast)

### Files in this step

```
packages/runtime/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── spectra.constants.ts
    ├── static-files.service.ts
    ├── spectra.controller.ts
    └── spectra.module.ts
```

### `packages/runtime/package.json`

```json
{
  "name": "@spectra/runtime",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "dependencies": {
    "@nestjs/common":          "^11.0.0",
    "@nestjs/core":            "^11.0.0",
    "@nestjs/platform-express":"^11.0.0",
    "@nestjs/serve-static":    "^5.0.0",
    "@spectra/core":           "workspace:*",
    "@types/express":          "^5.0.6"
  }
}
```

**Code walkthrough**:

- `"type": "module"` — Node treats `.js` files as native ESM (required because we use `.js` extensions in relative imports under NodeNext module resolution).
- `peerDependencies` — `@nestjs/common` and `@nestjs/core` are listed as peers, not direct deps, so the user's app picks one version of NestJS and we don't duplicate.
- `"workspace:*"` — pnpm resolves `@spectra/core` to the local monorepo package rather than the npm registry.

### `packages/runtime/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

**Why these settings**:
- `NodeNext` — matches the runtime (Node.js) ESM loader exactly. Combined with `.js` extensions in import paths, source files resolve at runtime without surprises.
- `experimentalDecorators: true` — NestJS uses TypeScript's experimental decorator syntax (`@Injectable()`, `@Controller()`, `@Get()`). Without this, the compiler strips them.
- `emitDecoratorMetadata: true` — NestJS uses `emitDecoratorMetadata` to learn what types to inject into constructor parameters.

### `packages/runtime/src/spectra.constants.ts`

```ts
import type { Provider } from "@nestjs/common";

/**
 * Injection tokens — strings used by NestJS to identify the providers
 * inside the module's DI container.
 */
export const SPECTRA_PROJECT_ROOT = "SPECTRA_PROJECT_ROOT";
export const SPECTRA_OPTIONS = "SPECTRA_OPTIONS";
export const SPECTRA_STATIC_FILES_LOADER = "SPECTRA_STATIC_FILES_LOADER";

/**
 * Provider factories for the DI tokens.
 *
 * Beginner's note: in NestJS a Provider is a recipe — a description
 * of how to create something. Using useValue here means "every
 * controller that injects this token gets back this exact value."
 */
export const spectraProviders = (projectRoot: string): Provider[] => [
    { provide: SPECTRA_PROJECT_ROOT, useValue: projectRoot },
];
```

**Beginner-friendly note on DI tokens**:
- In NestJS, a "provider" is something the framework can inject. Each provider has a "token" (a unique name) used to look it up.
- We declare the project's root path as a provider so any controller or service can ask for `SPECTRA_PROJECT_ROOT` and receive the path string.

### `packages/runtime/src/static-files.service.ts`

```ts
import { Inject, Injectable } from "@nestjs/common";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import * as path from "node:path";

import { SPECTRA_PROJECT_ROOT } from "./spectra.constants.js";

/**
 * Resolves — and lazily reads — the studio's static asset path
 * inside a Spectra project root.
 */
@Injectable()
export class SpectraStaticFilesService {
    public constructor(
        @Inject(SPECTRA_PROJECT_ROOT)
        private readonly projectRoot: string,
    ) {}

    public async resolveIndexHtml(): Promise<string> {
        const { assetsRoot } = await this.resolveAssetsRoot();
        return path.join(assetsRoot, "index.html");
    }

    public async resolveAssetsRoot(): Promise<{ assetsRoot: string }> {
        if (this.cachedPaths) {
            return { assetsRoot: this.cachedPaths.assetsRoot };
        }
        const studioDir = path.join(this.projectRoot, ".spectra", "studio");
        const studioZip = path.join(this.projectRoot, ".spectra", "studio.zip");
        if (existsSync(studioDir)) {
            this.cachedPaths = {
                indexHtml: path.join(studioDir, "index.html"),
                assetsRoot: studioDir,
            };
        } else if (existsSync(studioZip)) {
            const extracted = studioZip.replace(/\.zip$/, ".extracted");
            this.cachedPaths = {
                indexHtml: path.join(extracted, "index.html"),
                assetsRoot: extracted,
            };
        } else {
            this.cachedPaths = {
                indexHtml: path.join(studioDir, "index.html"),
                assetsRoot: studioDir,
            };
        }
        return { assetsRoot: this.cachedPaths.assetsRoot };
    }

    public async read(assetRelativePath: string): Promise<Buffer | null> {
        const { assetsRoot } = await this.resolveAssetsRoot();
        const target = path.join(assetsRoot, assetRelativePath);
        if (!existsSync(target)) return null;
        return readFile(target);
    }
}
```

**Code walkthrough**:

- `@Injectable()` marks this class as a provider NestJS can manage.
- `@Inject(SPECTRA_PROJECT_ROOT)` is constructor injection: when NestJS builds this class, it pulls the value registered for `SPECTRA_PROJECT_ROOT` (the project root path) and passes it in.
- `resolveAssetsRoot()` checks **two** locations for the studio: a directory (`<root>/.spectra/studio/`) or a zip file (`<root>/.spectra/studio.zip`) that we'd extract. The runtime supports both so the CLI can ship the studio either way.
- `this.cachedPaths = ...` — memoises the resolved path after the first call so subsequent requests don't hit the filesystem for path resolution.
- `read(assetRelativePath)` is a generic helper — the controller uses it to read both `document.bin` and `config.json` from the `.spectra/` folder.

### `packages/runtime/src/spectra.controller.ts`

```ts
import { Controller, Get, Header, Param, Res } from "@nestjs/common";
import type { Response } from "express";

import { SpectraStaticFilesService } from "./static-files.service.js";

/**
 * Public HTTP surface of the SpectraModule.
 *
 *   GET /spectra/document.bin    → the encoded documentation
 *   GET /spectra/config.json     → the spectra config (endpoint, etc.)
 */
@Controller()
export class SpectraController {
    public constructor(
        private readonly staticFiles: SpectraStaticFilesService,
    ) {}

    @Get(":endpoint/document.bin")
    @Header("Content-Type", "application/octet-stream")
    @Header("Cache-Control", "public, max-age=300")
    public async getDocumentBin(
        @Param("endpoint") _endpoint: string,
        @Res() res: Response,
    ): Promise<void> {
        const buf = await this.staticFiles.read("../../../document.bin");
        if (!buf) {
            res.status(404).json({
                error: "Spectra document not found",
                hint: "Run `spectra generate` first.",
            });
            return;
        }
        res.send(buf);
    }

    @Get(":endpoint/config.json")
    @Header("Content-Type", "application/json")
    public async getConfig(
        @Param("endpoint") _endpoint: string,
        @Res() res: Response,
    ): Promise<void> {
        const buf = await this.staticFiles.read("../../../config.json");
        if (!buf) {
            res.status(404).json({
                error: "Spectra config not found",
                hint: "Run `spectra generate` first.",
            });
            return;
        }
        res.send(buf);
    }
}
```

**Code walkthrough**:

- `@Controller()` with no path means the controller's routes are mounted at whatever path the parent module sets up (in this case, the user-provided `endpoint`).
- `@Get(":endpoint/document.bin")` defines a route. `:endpoint` is a route parameter that captures any path segment. We use the same prefix `/:endpoint/document.bin` because the module mounts the controller at `/`, so when served under `/spectra/`, the actual URL becomes `/spectra/document.bin`.
- `@Header(...)` decorators set HTTP response headers. `application/octet-stream` is the standard MIME type for binary blobs. `max-age=300` lets the browser cache the file for 5 minutes.
- `@Param("endpoint") _endpoint: string` injects the captured URL segment; the underscore prefix tells readers we don't use it. The route param is consumed by NestJS's router, not the controller.
- `@Res() res: Response` injects the Express response object so we can set status and send bytes directly. We use this instead of returning the bytes because NestJS would otherwise try to JSON-serialise a Buffer.
- The 404 response is purposefully helpful — it tells the user to run `spectra generate` if they forgot.

### `packages/runtime/src/spectra.module.ts`

```ts
import {
    DynamicModule,
    MiddlewareConsumer,
    Module,
    NestModule,
} from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";
import * as path from "node:path";

import { SpectraStaticFilesService } from "./static-files.service.js";
import { SpectraController } from "./spectra.controller.js";
import { SPECTRA_OPTIONS, spectraProviders } from "./spectra.constants.js";

export interface SpectraModuleOptions {
    readonly endpoint: string;
    readonly projectRoot?: string;
}

@Module({
    providers: [SpectraStaticFilesService],
    controllers: [SpectraController],
})
export class SpectraModule implements NestModule {
    public static forRoot(
        options: SpectraModuleOptions,
    ): DynamicModule {
        const projectRoot = options.projectRoot ?? process.cwd();

        return {
            module: SpectraModule,
            imports: [
                ServeStaticModule.forRoot({
                    serveRoot: path.join(projectRoot, ".spectra", "studio"),
                    serveStaticOptions: {
                        fallthrough: true,
                    },
                }),
            ],
            providers: spectraProviders(projectRoot),
            exports: [SpectraStaticFilesService],
        };
    }

    public configure(consumer: MiddlewareConsumer): void {
        void consumer;
    }
}

export { SPECTRA_OPTIONS };
```

**Code walkthrough**:

- `forRoot(options)` returns a `DynamicModule`. NestJS modules can either be regular (a fixed class) or dynamic (returning a config object). The dynamic form lets us accept runtime config like the `endpoint` string.
- `ServeStaticModule.forRoot({ serveRoot, ... })` is the official NestJS module for serving static assets. We point it at `<projectRoot>/.spectra/studio/` so the studio's HTML/JS/CSS are served on the same path as our controller routes.
- `fallthrough: true` means unknown paths (e.g. `/spectra/some/deep/route`) return a 404 instead of `index.html`. The studio is a single-page app, so the fallback to `index.html` happens at the controller level via the `_not-found` route.

### `packages/runtime/src/index.ts`

```ts
export { SpectraModule } from "./spectra.module.js";
export type { SpectraModuleOptions } from "./spectra.module.js";
export { SpectraController } from "./spectra.controller.js";
export { SpectraStaticFilesService } from "./static-files.service.js";
```

The barrel — everything consumers need is exported through this single entry point. With `"."` in `package.json` exports, users get all of this from `import { ... } from "@spectra/runtime"`.

---

## Step 2 — Make studio exportable as static HTML

### Problem

`apps/studio/` is a Next.js dev server. The user runs `spectra generate` somewhere with no Node process to spare. We need a pre-built bundle of plain HTML/CSS/JS that can be served as files.

### Solution

Next.js supports `output: 'export'` which produces a folder of plain static files.

### `apps/studio/next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@spectra/core"],
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

**Code walkthrough**:

- `output: "export"` — tells Next.js to produce plain HTML/CSS/JS at build time instead of a Node server bundle. The output goes to `apps/studio/out/`.
- `images: { unoptimized: true }` — Next.js's image optimizer runs as a server-side Node process. Static export can't run that, so we tell it to skip optimization and serve raw images.
- `trailingSlash: true` — produces `/index.html` for every route. This makes `<endpoint>/foo` work via directory-fallback when a static file server (like `serve-static`) hits an unknown sub-path.
- `transpilePackages: ["@spectra/core"]` — tells Next.js's bundler to transpile the workspace package. Without this, Next.js may complain about TS syntax in `@spectra/core` imports.

### Verification

```bash
$ cd apps/studio && pnpm build
✓ Compiled successfully in 1361ms
✓ Generating static pages (4/4) in 192ms
$ ls out/
404.html  _next/  favicon.ico  index.html  ...
```

---

## Step 3 — Bundle studio into CLI

### Problem

Two artifacts to publish (CLI + studio) is one too many. We want a single tarball the user can `npm install` and have everything work.

### Solution

The bundler script (esbuild) takes `apps/studio/out/` and `cpSync`s it into `packages/cli/dist/studio/`. The CLI's runtime then copies this into the user's `.spectra/studio/` directory.

### `packages/cli/scripts/bundle.mjs`

```js
#!/usr/bin/env node
import { build } from "esbuild";
import { cpSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(here, "..");

const OUT_DIR = path.join(pkgRoot, "dist");
const OUT_FILE = path.join(OUT_DIR, "spectra.mjs");

mkdirSync(OUT_DIR, { recursive: true });

const result = await build({
    entryPoints: [path.join(pkgRoot, "src/index.ts")],
    outfile: OUT_FILE,
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    sourcemap: false,
    minify: false,
    treeShaking: true,
    external: ["typescript", "node:*"],
    logLevel: "info",
    metafile: true,
});

const shebang = "#!/usr/bin/env node\n";
const body = readFileSync(OUT_FILE, "utf8");
if (!body.startsWith("#!")) {
    writeFileSync(OUT_FILE, shebang + body);
}

try {
    const { chmodSync } = await import("node:fs");
    chmodSync(OUT_FILE, 0o755);
} catch { /* best-effort */ }

console.log(`\n✓ bundled ${OUT_FILE}`);
console.log(`  ${(result.metafile?.outputs?.[OUT_FILE]?.bytes ?? 0).toLocaleString()} bytes`);

/* ------------------------------------------------------------------ */
/* Studio copy                                                         */
/* ------------------------------------------------------------------ */
const studioSrc = path.resolve(pkgRoot, "..", "..", "apps", "studio", "out");
const studioDst = path.join(OUT_DIR, "studio");

if (existsSync(studioSrc)) {
    cpSync(studioSrc, studioDst, { recursive: true });
    console.log(`✓ staged studio → ${path.relative(process.cwd(), studioDst)}`);
} else {
    console.warn(`⚠ studio not built yet — skipping. Run \`pnpm --filter studio build\` and re-run this script.`);
}
```

**Code walkthrough**:

- `build({ entryPoints: ..., bundle: true, ... })` — esbuild's `bundle: true` flag means **every import** in `src/index.ts` (and every import in those imports, recursively) is **inlined** into the output file. The result is one `spectra.mjs` file with the CLI source code, `@spectra/core` source, `@spectra/provider-nestjs` source, `@msgpack/msgpack`, `pako`, etc. all bundled together.
- `external: ["typescript", "node:*"]` — there are two things we deliberately keep external:
  - `typescript` uses dynamic `require()` for filesystem access internally. esbuild can't model dynamic requires in ESM output, so we keep it external and let Node load it from `node_modules` at runtime.
  - `node:*` matches all Node built-ins (`fs`, `path`, `zlib`, etc.). Bundling them produces broken output because they don't exist as files on disk — they're embedded in Node itself.
- The shebang prepend `#!/usr/bin/env node` makes the output file directly executable as `./spectra.mjs` (Unix). `chmodSync(..., 0o755)` makes it actually runnable without an explicit `node` invocation.
- The studio copy section handles two scenarios:
  - Studio is built (`apps/studio/out/` exists) → copy it next to the CLI binary as `dist/studio/`.
  - Studio is NOT built → log a warning so the contributor knows to run `pnpm --filter studio build` before re-bundling the CLI.

### `packages/cli/src/pipeline/copy-studio.ts`

```ts
import { cpSync, existsSync, mkdirSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copy the bundled studio static files into `<projectRoot>/.spectra/studio/`.
 *
 * Source resolution logic — works for both:
 *   1. Dev (tsx): src/pipeline/copy-studio.ts is run directly. The
 *      studio lives at ../../../../apps/studio/out in the monorepo.
 *   2. Production (bundled): spectra.mjs lives at
 *      packages/cli/dist/spectra.mjs. The studio is at the sibling
 *      packages/cli/dist/studio/.
 *
 * The resolved path is whichever directory contains an index.html
 * sitting next to a _next/ folder.
 */
export function copyBundledStudio(
    projectRoot: string,
    importMetaUrl: string,
): { copied: boolean; destination: string | undefined } {
    const here = path.dirname(fileURLToPath(importMetaUrl));
    const candidates = [
        path.resolve(here, "studio"),
        path.resolve(here, "..", "..", "..", "..", "apps", "studio", "out"),
        path.resolve(here, "..", "..", "..", "apps", "studio", "out"),
    ];

    const source = candidates.find((candidate) =>
        existsSync(path.join(candidate, "index.html")),
    );

    if (!source) {
        return { copied: false, destination: undefined };
    }

    const destination = path.join(projectRoot, ".spectra", "studio");
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
    return { copied: true, destination };
}
```

**Code walkthrough**:

- `import.meta.url` is a special variable that holds the URL of the current module. For bundled files, this resolves to the location of `spectra.mjs`. For `.ts` source running via `tsx`, it's the location of `copy-studio.ts`.
- We try **three candidate paths** in order: the obvious "sibling of spectra.mjs" case, and two monorepo-relative paths for when someone runs the CLI from source via `tsx`. The first one that contains `index.html` wins.
- `cpSync(..., { recursive: true })` — Node's filesystem copy with recursion. We need this because the studio is a directory tree (HTML, JS chunks, CSS, images, etc.).
- We return whether the copy happened so the caller can log a warning if the studio wasn't found.

### `packages/cli/src/pipeline/generate-document.ts` (excerpt — studio copy step)

```ts
// ---- Stage 3: studio copy ----------------------------------------
// The studio is a sibling of the bundled CLI binary. We try
// several candidate paths to support both dev (running from
// source via tsx) and prod (running from the bundled spectra.mjs).
// A missing studio just means we skip the UI — the binary doc
// still works without it.
const studioCopy = copyBundledStudio(args.projectRoot, args.callerUrl);

return {
    // ...other fields
    studioDestination: studioCopy.destination,
};
```

**Code walkthrough**:

- After the encode + write stages, we copy the studio. This is part of the CLI's local pipeline module — the rest of the CLI doesn't need to know about it.
- The user passes `callerUrl: import.meta.url` from `cli/commands/generate.ts` so this function can locate the bundled studio relative to whichever file invoked it.

---

## Step 4 — Next.js-style URL banner

### Problem

After a successful build, the user doesn't know what to do next. They need to know:
1. Where to mount the runtime in their NestJS app
2. What URL to open in their browser
3. That the build actually succeeded

### Solution

A pretty-printed banner that mimics the Next.js dev server output style — colour, Unicode box drawing, step-by-step instructions.

### `packages/cli/src/output/url-banner.ts`

```ts
export interface UrlBannerArgs {
    readonly endpoint: string;
    /** Default port the user's NestJS server is expected to run on. */
    readonly port?: number;
}

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
```

**Code walkthrough**:

- `process.stdout.isTTY` — checks if the output is going to a real terminal (interactive user) or being piped/redirected (CI, file). When piping, we skip the colour codes so logs stay readable.
- The colour helpers wrap strings with ANSI escape codes (`\x1b[2m` for dim, `\x1b[32m` for green, etc.) only when colour is enabled.
- The template uses Unicode box drawing (`─`, `▲`, `→`) that mirrors what Next.js prints when you run `next dev`.
- Each "next step" is colour-coded so the user can scan-read the banner and know exactly what to copy-paste into their code.

### Output

```
──────────────────────────────────────────────────────────
▲ SPECTRA · ready

  Local:  http://localhost:3000/api-docs

  →  Next steps:
  1. Mount SpectraModule.forRoot({ endpoint: '/api-docs' })
     in your AppModule.
  2. Start your NestJS app on port 3000.
  3. Open http://localhost:3000/api-docs in a browser.
──────────────────────────────────────────────────────────
```

---

## Step 5 — Client-side `document.bin` decoder

### Problem

We don't want a per-page JSON roundtrip. The studio should fetch a compact binary file once and decode everything in the browser.

### Solution

A small utility that fetches `document.bin`, validates the SPBC magic header, ungzips with `pako`, and decodes the msgpack payload with `@msgpack/msgpack`.

### `apps/studio/src/lib/decodeDocumentBin.ts`

```ts
import { decode as msgpackDecode } from "@msgpack/msgpack";
import { ungzip } from "pako";

import type { Documentation } from "@spectra/core";

/** The SPBC magic header — must match the bytes the CLI's
 *  MsgpackGzipEncoder prepends. */
const SPECTRA_BIN_MAGIC = new Uint8Array([0x53, 0x50, 0x42, 0x43]); // "SPBC"
const SPECTRA_BIN_HEADER_SIZE = 8;

export interface DecodedDocument {
    readonly documentation: Documentation;
    readonly version: number;
    readonly decodedAt: number;
}

export async function loadDocumentBin(
    source: string = "document.bin",
    fetcher: typeof fetch = fetch,
): Promise<DecodedDocument> {
    const response = await fetcher(source);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${source}: ${response.status} ${response.statusText}`);
    }

    const bytes = new Uint8Array(await response.arrayBuffer());

    if (bytes.byteLength < SPECTRA_BIN_HEADER_SIZE) {
        throw new Error(`Spectra bin file is too short: ${bytes.byteLength} bytes (need at least ${SPECTRA_BIN_HEADER_SIZE}).`);
    }

    for (let i = 0; i < SPECTRA_BIN_MAGIC.length; i++) {
        if (bytes[i] !== SPECTRA_BIN_MAGIC[i]) {
            throw new Error("Not a Spectra binary document (magic header mismatch).");
        }
    }

    const version = readUInt32LE(bytes, 4);
    const payload = bytes.subarray(SPECTRA_BIN_HEADER_SIZE);

    // pako.ungzip returns a Uint8Array of decompressed bytes.
    const decompressed = ungzip(payload);
    const documentation = msgpackDecode(decompressed) as Documentation;

    return { documentation, version, decodedAt: Date.now() };
}

function readUInt32LE(bytes: Uint8Array, offset: number): number {
    return (
        (bytes[offset]! |
            (bytes[offset + 1]! << 8) |
            (bytes[offset + 2]! << 16) |
            (bytes[offset + 3]! << 24)) >>>
        0
    );
}
```

**Code walkthrough**:

- `SPECTRA_BIN_MAGIC = new Uint8Array([0x53, 0x50, 0x42, 0x43])` — that's the bytes for `"SPBC"` (Spectra Binary Container). The first 4 bytes of any `document.bin` should match. If they don't, we throw — that's our way of saying "this isn't ours."
- `fetcher: typeof fetch = fetch` — dependency injection for the network call. Tests pass a fake `fetch` here; production uses the browser's built-in.
- `bytes.subarray(SPECTRA_BIN_HEADER_SIZE)` — `subarray` returns a view into the same buffer (no copy) starting after the 8-byte header. The header is `magic[4] + version[4]`.
- `ungzip(payload)` is `pako`'s named export for inflating gzipped data. We named-import it because pako v3 dropped the default export.
- `msgpackDecode(decompressed)` returns `unknown`, so we cast to `Documentation`. The CLI uses the same schema on the encoder side, so the round-trip is type-safe by construction.
- `readUInt32LE(bytes, 4)` — manual little-endian read for the version uint32 that follows the magic. We could use `DataView` but the inline implementation has zero dependencies.

---

## Step 6 — localStorage edit buffer

### Problem

Re-decoding `document.bin` on every page load wastes CPU. The studio also needs to let users save edits **locally** without ever touching `document.bin`.

### Solution

A React hook that:
1. Synchronously reads localStorage on mount
2. Falls back to fetching + decoding if no cache
3. Provides `save()`, `reset()`, `exportJson()` actions

### `apps/studio/src/lib/documentationStore.ts`

```ts
"use client";

import { useEffect, useState, useCallback } from "react";

import type { Documentation } from "@spectra/core";

import { loadDocumentBin, type DecodedDocument } from "./decodeDocumentBin";

function docKey(endpoint: string): string {
    return `spectra-doc:${endpoint}`;
}

function endpointFromLocation(): string {
    if (typeof window === "undefined") return "/spectra";
    return window.location.pathname.replace(/\/$/, "") || "/spectra";
}

export interface DocumentationState {
    readonly documentation: Documentation | undefined;
    readonly status: "loading" | "ready" | "error";
    readonly error?: string;
    readonly fromCache: boolean;
    readonly hasUnsavedEdits: boolean;
    readonly version: number | undefined;
}

export interface DocumentationActions {
    save: () => void;
    reset: () => Promise<void>;
    exportJson: () => string | undefined;
}

export type UseDocumentationResult = DocumentationState & DocumentationActions;

export function useDocumentation(): UseDocumentationResult {
    const endpoint = endpointFromLocation();
    const key = docKey(endpoint);

    const [state, setState] = useState<DocumentationState>(() => {
        if (typeof window === "undefined") {
            return { documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined };
        }
        const cached = readCache(key);
        if (cached) {
            return {
                documentation: cached.documentation,
                status: "ready",
                fromCache: true,
                hasUnsavedEdits: false,
                version: cached.version,
            };
        }
        return { documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined };
    });

    useEffect(() => {
        // If we hydrated from cache, no fetch needed.
        if (state.fromCache || state.status === "error") return;

        let cancelled = false;

        loadDocumentBin("document.bin")
            .then((decoded: DecodedDocument) => {
                if (cancelled) return;
                setState({
                    documentation: decoded.documentation,
                    status: "ready",
                    fromCache: false,
                    hasUnsavedEdits: false,
                    version: decoded.version,
                });
            })
            .catch((err) => {
                if (cancelled) return;
                setState({
                    documentation: undefined,
                    status: "error",
                    fromCache: false,
                    hasUnsavedEdits: false,
                    version: undefined,
                    error: err instanceof Error ? err.message : String(err),
                });
            });

        return () => {
            cancelled = true;
        };
    }, [endpoint, state.fromCache, state.status]);

    const save = useCallback(() => {
        if (!state.documentation) return;
        writeCache(key, {
            documentation: state.documentation,
            version: state.version ?? 0,
            savedAt: Date.now(),
        });
        setState((prev) => ({ ...prev, hasUnsavedEdits: false }));
    }, [key, state.documentation, state.version]);

    const reset = useCallback(async () => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
        }
        setState({ documentation: undefined, status: "loading", fromCache: false, hasUnsavedEdits: false, version: undefined });
        const decoded = await loadDocumentBin("document.bin");
        setState({
            documentation: decoded.documentation,
            status: "ready",
            fromCache: false,
            hasUnsavedEdits: false,
            version: decoded.version,
        });
    }, [key]);

    const exportJson = useCallback((): string | undefined => {
        if (!state.documentation) return undefined;
        return JSON.stringify(state.documentation, null, 2);
    }, [state.documentation]);

    return {
        documentation: state.documentation,
        status: state.status,
        error: state.error,
        fromCache: state.fromCache,
        hasUnsavedEdits: state.hasUnsavedEdits,
        version: state.version,
        save,
        reset,
        exportJson,
    };
}

interface CachePayload {
    readonly documentation: Documentation;
    readonly version: number;
    readonly savedAt: number;
}

function readCache(key: string): CachePayload | undefined {
    if (typeof window === "undefined") return undefined;
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return undefined;
        return JSON.parse(raw) as CachePayload;
    } catch {
        return undefined;
    }
}

function writeCache(key: string, payload: CachePayload): void {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(payload));
    } catch { /* quota or serialization failure — ignore silently */ }
}
```

**Code walkthrough**:

- The `useState(() => ...)` initializer runs **once** on mount. We read localStorage synchronously here so the first render already shows the cached doc — no flash of "loading."
- `endpointFromLocation()` — derives the localStorage key from `window.location.pathname`. So `/spectra` and `/api-docs` on the same origin don't collide.
- The `useEffect` handles the **network path**: if no cache, fetch + decode, then `setState`.
- `cancelled` flag inside the effect — handles React Strict Mode's double-mounting in dev. If the component unmounts before the promise resolves, we don't update state on a dead component.
- `save()` writes the current view to localStorage with a timestamp. The cache payload includes `version` so future reads can compare and warn about stale caches.
- `reset()` drops the cache, then re-runs the fetch+decode path. Useful after the user runs `spectra generate` upstream — they can hit Reset to forget the previous cached version.
- `exportJson()` returns a pretty-printed JSON string of the active doc. The Save/Export UI turns this into a downloadable file.
- SSR safety — every `window` access is guarded with `typeof window === "undefined"` because Next.js may run this code on the server during build/SSR. Throwing inside render would crash the page.

---

## Step 7 — Save / Reset / Export UI

### Problem

The brief required explicit user actions to persist or reset, not automatic syncing. A floating UI panel in the bottom-right shows the status and exposes three buttons.

### Solution

A small React component that calls `useDocumentation()` and renders the panel.

### `apps/studio/src/components/studio-controls/StudioControls.tsx`

```tsx
"use client";

import * as React from "react";
import { Check, Download, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import { useDocumentation } from "@/lib/documentationStore";

export function StudioControls(): React.ReactElement | null {
    const {
        status,
        fromCache,
        save,
        reset,
        exportJson,
    } = useDocumentation();

    const [exportUrl, setExportUrl] = React.useState<string | undefined>();

    React.useEffect(() => {
        if (!exportUrl) return;
        return () => {
            URL.revokeObjectURL(exportUrl);
        };
    }, [exportUrl]);

    const handleExport = React.useCallback(() => {
        const json = exportJson();
        if (!json) return;
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        setExportUrl(url);
        const a = document.createElement("a");
        a.href = url;
        a.download = "documentation.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [exportJson]);

    if (typeof window === "undefined") return null;
    if (status === "loading") {
        return (
            <div className="fixed bottom-4 right-4 z-50 rounded-md border border-border bg-bg-base px-3 py-2 text-xs text-text-secondary shadow-md">
                <span className="font-mono">⏳ Loading document.bin…</span>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-border bg-bg-base px-3 py-2 text-xs shadow-md">
            <StatusPill status={status} fromCache={fromCache} />

            <Tooltip content="Persist current view to localStorage">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={save}
                    className={cn(
                        "h-7 gap-1.5 text-text-secondary",
                        status === "ready" && "text-status-2xx hover:text-status-2xx",
                    )}
                    aria-label="Save documentation view to localStorage"
                >
                    <Save className="h-3.5 w-3.5" aria-hidden />
                    <span>Save</span>
                </Button>
            </Tooltip>

            <Tooltip content="Discard local cache and re-fetch document.bin from the server">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        void reset();
                    }}
                    className="h-7 gap-1.5 text-text-secondary"
                    aria-label="Reset local cache"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    <span>Reset</span>
                </Button>
            </Tooltip>

            <Tooltip content="Download active document as JSON">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExport}
                    className="h-7 gap-1.5 text-text-secondary"
                    aria-label="Export document as JSON"
                >
                    <Download className="h-3.5 w-3.5" aria-hidden />
                    <span>Export</span>
                </Button>
            </Tooltip>

            {exportUrl && (
                <span className="ml-1 inline-flex items-center gap-1 text-status-2xx">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                    <span>Downloaded</span>
                </span>
            )}
        </div>
    );
}

function StatusPill({
    status,
    fromCache,
}: {
    status: "ready" | "error";
    fromCache: boolean;
}): React.ReactElement {
    if (status === "error") {
        return (
            <span className="inline-flex items-center gap-1 font-mono text-method-delete">
                ✗ error
            </span>
        );
    }
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 font-mono",
                fromCache ? "text-text-secondary" : "text-status-2xx",
            )}
            title={
                fromCache
                    ? "Loaded from localStorage cache"
                    : "Fetched fresh from document.bin"
            }
        >
            <Check className="h-3.5 w-3.5" aria-hidden />
            <span>{fromCache ? "Cached locally" : "Fresh from .spectra/"}</span>
        </span>
    );
}
```

**Code walkthrough**:

- The component lives at the bottom-right (`fixed bottom-4 right-4 z-50`). `z-50` ensures it's always above other UI.
- `status === "loading"` shows a minimal "Loading…" pill — we don't render the buttons until the doc is ready because Reset/Save would be no-ops.
- The status pill is the **first thing** the user sees, so they always know what state they're in:
  - `"Fresh from .spectra/"` (green) — doc was just fetched from the network.
  - `"Cached locally"` (gray) — doc came from localStorage (no network call this time).
  - `"✗ error"` (red) — fetch or decode failed.
- `handleExport` uses the browser's `Blob` + `URL.createObjectURL` + a temporary `<a download>` to trigger a file download. This is the standard "download JSON from the browser" pattern.
- `URL.revokeObjectURL(exportUrl)` in the effect cleanup prevents memory leaks — every `createObjectURL` allocates until you call `revokeObjectURL` on it.
- `confirm("Run \`spectra generate\` first.")` — the error path on the runtime side already gives a helpful hint, but we surface a friendly message here too in case the studio is loaded standalone.

### Mounted in `apps/studio/src/components/layout/AppLayout.tsx`

```tsx
return (
    <>
      <AppLayoutShell>{children}</AppLayoutShell>
      <StudioControls />
    </>
);
```

**Why here**: AppLayout wraps every page. Mounting `<StudioControls />` here makes the floating panel available on every route, not just the main workspace.

---

## End-to-end verification

The full pipeline run, from cold:

```bash
$ cd apps/example-api
$ rm -rf .spectra
$ node ../../packages/cli/dist/spectra.mjs generate --endpoint /api-docs
```

Output:

```
──────────────────────────────────────────────────────────
▲ SPECTRA · ready

  Local:  http://localhost:3000/api-docs

  →  Next steps:
  1. Mount SpectraModule.forRoot({ endpoint: '/api-docs' }) in your AppModule.
  2. Start your NestJS app on port 3000.
  3. Open http://localhost:3000/api-docs in a browser.
──────────────────────────────────────────────────────────
```

Files produced:

```
.spectra/
├── document.bin    # 1849 bytes — msgpack + gzip + SPBC header
├── config.json     # { endpoint: "/api-docs", schemaVersion: 1, updatedAt: ... }
└── studio/         # full static studio bundle (~1.4 MB)
    ├── index.html
    ├── _next/
    └── ...
```

What the user does next:

```ts
// In their NestJS app's AppModule:
import { SpectraModule } from "@spectra/runtime";

@Module({
    imports: [
        SpectraModule.forRoot({ endpoint: "/api-docs" }),
    ],
})
export class AppModule {}
```

```bash
$ nest start
# Server starts on http://localhost:3000
```

Open `http://localhost:3000/api-docs` in a browser. The studio loads, fetches `/api-docs/document.bin`, decodes it, and renders the docs UI with a floating Save/Reset/Export panel.

---

## Commits

```
62dea8c fix(studio): import pako named export + add CLI README
9ec74c0 feat(studio): floating StudioControls panel (Save / Reset / Export)
ae0e76b feat(studio): localStorage-backed Documentation store + useDocumentation hook
d61bdac feat(studio): client-side document.bin decoder
961c594 feat(cli): emit Next.js-style URL banner after a successful generate
9bbdfaa feat(cli): ship the studio bundle inside the CLI tarball
e027e06 build(studio): enable Next.js static export (output: 'export')
caa936f feat(runtime): add @spectra/runtime NestJS module serving .spectra/
```

---

## Ready to publish

```bash
cd packages/cli
pnpm publish --dry-run   # verify before going live
pnpm publish             # publish to npm
```

Users install with:

```bash
pnpm add -D @spectra/cli
# or
npm install --save-dev @spectra/cli
```

…and run:

```bash
npx spectra generate --endpoint /api-docs
```

Everything they need — the encoder, the decoder, the studio UI, the
runtime module — ships in one tarball. The CLI extracts the studio
into their project's `.spectra/` directory, and their NestJS server
serves it via `@spectra/runtime`. The whole loop is one command and
two lines of integration.
