# `@spectra/cli` — Documentation Generator

The CLI half of Spectra. Scans a NestJS project, encodes the
resulting API surface (controllers, routes, DTOs, guards) as a
compact binary, and ships the docs studio alongside it.

## Install

```sh
pnpm add -D @spectra/cli
# or
npm install --save-dev @spectra/cli
```

## Run

Inside your NestJS project root:

```sh
pnpm spectra generate                   # uses /spectra by default
pnpm spectra generate --endpoint /api-docs
pnpm spectra generate --no-verify       # skip round-trip check
pnpm spectra generate --json            # machine-readable output
```

After a successful run your project has:

```
.spectra/
├── document.bin    # msgpack + gzip + SPBC-header encoded documentation
├── config.json     # { endpoint, schemaVersion, updatedAt }
└── studio/         # static studio bundle — served by @spectra/runtime
```

The CLI prints a Next.js-style summary telling you where the studio
will be served once your NestJS server is running:

```
▲ SPECTRA · ready
  Local:  http://localhost:3000/api-docs
  →  Next steps:
  1. Mount SpectraModule.forRoot({ endpoint: '/api-docs' }) in your AppModule.
  2. Start your NestJS app on port 3000.
  3. Open http://localhost:3000/api-docs in a browser.
```

## Wire the runtime

In your NestJS `AppModule`:

```ts
import { Module } from "@nestjs/common";
import { SpectraModule } from "@spectra/runtime";

@Module({
  imports: [SpectraModule.forRoot({ endpoint: "/api-docs" })],
})
export class AppModule {}
```

That's it. The runtime serves:

- `GET /api-docs`              → the studio HTML/CSS/JS
- `GET /api-docs/document.bin` → the encoded doc
- `GET /api-docs/config.json`  → the spectra config

## How the studio works

1. On first open, the studio fetches `document.bin` and decodes it
   client-side (msgpack + gzip).
2. The decoded document is cached in `localStorage` (key
   `spectra-doc:{endpoint}`) so the next page load is instant.
3. A floating panel in the bottom-right exposes three buttons:
   - **Save**   → write the current view to localStorage
   - **Reset**  → drop the cache and re-fetch document.bin
   - **Export** → download the active doc as JSON

The CLI / runtime / studio share one invariant: **`document.bin`
is the source of truth.** localStorage is a browser-only cache;
the CLI never writes to it from outside; the studio never writes to
the server. Editing the doc requires re-running `spectra generate`.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLI (this package — runs at build time)                       │
│  • tsx/spectra generate ...                                     │
│  • reads projectRoot, writes .spectra/                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  @spectra/provider-nestjs (already in workspace)                │
│  • DocumentationBuilder scans controllers/routes/DTOs           │
│  • SpectraBuildPipeline runs build → encode → write              │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  @spectra/core/encoding                                         │
│  • MsgpackGzipEncoder + FileSystemSpectraWriter                 │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                   .spectra/document.bin
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  @spectra/runtime (NestJS, in your app)                        │
│  • SpectraModule.forRoot({ endpoint: "/api-docs" })            │
│  • ServeStaticModule mounts .spectra/studio/                     │
│  • GET /api-docs/document.bin → encoded doc                   │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                  Browser opens /api-docs
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Studio (apps/studio — bundled inside this CLI tarball)         │
│  • Fetches /document.bin                                       │
│  • Decodes msgpack + gzip in the browser                        │
│  • Caches in localStorage, Save/Reset/Export buttons             │
└─────────────────────────────────────────────────────────────────┘
```

## Solo CLI invocation

You can also run the bundled binary directly:

```sh
node packages/cli/dist/spectra.mjs generate
```

This is what npm-published installs (`spectra`) resolve to.

## See also

- `@spectra/runtime` — NestJS module that serves the studio
- `@spectra/provider-nestjs` — the analysis pipeline
- `@spectra/core` — shared types + the msgpack/gzip encoder
