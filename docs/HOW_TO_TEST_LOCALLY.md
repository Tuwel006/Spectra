# Spectra · How To Test It End‑to‑End Locally

> **Audience:** someone who has been vibe‑coding on this repo and now wants to
> hold the whole thing in their head so they can run it, see what it does, and
> predict where each byte of output goes. We assume Node 20+, pnpm 11, and a
> terminal. No prior knowledge of any one package is required.

---

## 0. The 30‑second pitch (read this first)

Spectra turns a NestJS project's source code into a browsable API
documentation website. You do **not** edit the docs by hand — you write your
NestJS controllers, then run one CLI command, and the CLI:

1. **Reads** your project's `.ts` files,
2. **Builds** a typed `Documentation` object describing every route, schema
   and tag,
3. **Encodes** that object into a binary file (msgpack + gzip + a 4‑byte
   magic header that spells `"SPBC"`),
4. **Writes** it to `<your-project>/.spectra/document.bin` plus a tiny
   `config.json` and a copy of the studio static assets.

You then mount one NestJS module in your real app, start the server, and
open `http://localhost:<port>/<your-endpoint>` in a browser. The studio
HTML fetches the `.bin`, **decodes it in the browser** with pako and
msgpack, and renders the docs. Any edits you make in the studio save to
**localStorage only** — they never re‑write `.bin`. The bin is only ever
re‑written when you re‑run the CLI.

That's the whole product. Everything below is just unpacking that sentence.

---

## 1. The codebase at a glance

```
Spectra/
├── apps/
│   ├── example-api/          ← the toy NestJS project we will scan
│   └── studio/               ← the Next.js docs UI (decodes bin in browser)
├── packages/
│   ├── core/                 ← shared types + the encode / decode library
│   ├── provider-nestjs/      ← scans a NestJS project, builds Documentation
│   ├── runtime/              ← a NestJS module that SERVES .spectra/ + studio
│   └── cli/                  ← the `spectra generate` command
└── docs/                     ← the folder this file lives in
```

**Who depends on who** (arrows = "imports from"):

```
                ┌─────────────────────┐
                │  apps/example-api   │  (your NestJS app)
                └────────┬────────────┘
                         │  mounts at runtime
                         ▼
                ┌─────────────────────┐
                │  packages/runtime   │  serves .spectra/ + studio static
                └────────┬────────────┘
                         │  uses
                         ▼
                ┌─────────────────────┐
                │  packages/core      │  types + encoding (msgpack+gzip)
                └────────▲────────────┘
                         │
       ┌─────────────────┴──────────────────┐
       │                                    │
┌─────────────────────┐            ┌─────────────────────┐
│ packages/cli        │            │ apps/studio         │
│ (the `spectra` bin) │            │ (Next.js docs UI)   │
└────────┬────────────┘            └─────────────────────┘
         │  invokes                            ▲
         ▼                                     │  decoded .bin shown here
┌─────────────────────┐                        │
│ packages/           │                        │
│ provider-nestjs     │   scan + build         │
└─────────────────────┘────────────────────────┘
```

Two **independent** entry points feed off the same `.bin`:

| Direction        | Who runs it              | What it produces / reads                                     |
|------------------|--------------------------|--------------------------------------------------------------|
| **Authoring**    | you, in your project dir | `.spectra/document.bin` + `config.json` + `studio/`          |
| **Browsing**     | anyone opening the URL   | decoded Documentation in browser → React UI, `localStorage`  |

---

## 2. What `spectra generate` actually does

Open the gate with one command, then we'll trace it step by step.

### 2.1 The command

```bash
# In your NestJS project (e.g. apps/example-api):
pnpm spectra generate
```

That is `packages/cli/src/index.ts` re‑exported via the `bin` field
`"spectra": "./dist/spectra.mjs"` in `packages/cli/package.json`.

You can also pass flags (we'll see those later):

| Flag              | What it does                                                           |
|-------------------|------------------------------------------------------------------------|
| `--no-verify`     | skip the round‑trip decode test                                         |
| `--json`          | machine‑readable report instead of the human banner                    |
| `--out <path>`    | override where the bin lands (`<projectRoot>/.spectra/document.bin` by default) |
| `--endpoint <p>`  | explicit mount path (e.g. `/spectra`). Omit → auto‑slug from package name |
| `-e`              | same as `--endpoint`, with no value → auto‑generate from package name   |

### 2.2 The full pipeline, diagrammed

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                        spectra generate                              │
  │                                                                      │
  │   runCli("generate")                                                 │
  │     │                                                                │
  │     ▼                                                                │
  │   runGenerate(args)                                                  │
  │     │                                                                │
  │     ├─► resolveEndpoint()  ──►  .{cli / auto / config / default}     │
  │     │                          returns the mount path e.g. /spectra  │
  │     │                                                                │
  │     └─► generateDocument()      (packages/cli/src/pipeline/)        │
  │           │                                                          │
  │           ▼                                                          │
  │         ┌────────── Stage 1: BUILD ──────────┐                       │
  │         │ DocumentationBuilder               │                       │
  │         │  (provider-nestjs)                 │                       │
  │         │                                    │                       │
  │         │   scans your src/                  │                       │
  │         │   reads @Controller, @Get, @Body    │                       │
  │         │   reads DTO classes & types        │                       │
  │         │   reads ApiProperty / tags / etc.  │                       │
  │         │                                    │                       │
  │         │   produces a `Documentation`       │                       │
  │         │   object — PURE data, no I/O       │                       │
  │         └─────────────────┬──────────────────┘                       │
  │                           │                                          │
  │                           ▼                                          │
  │         ┌────────── Stage 2: ENCODE ─────────┐                       │
  │         │ SpectraBuildPipeline.run()         │                       │
  │         │  pipeline uses:                    │                       │
  │         │   • MsgpackGzipEncoder             │                       │
  │         │       (msgpack → gzip)             │                       │
  │         │                                    │                       │
  │         │   payload bytes look like:         │                       │
  │         │   ┌────┬─────────────┬───────────┐ │                       │
  │         │   │ "SPBC"│ version:u32│ msgpack   │ │                      │
  │         │   │ 4 B  │   4 B       │ gzip(body)│ │                       │
  │         │   └────┴─────────────┴───────────┘ │                       │
  │         └─────────────────┬──────────────────┘                       │
  │                           │                                          │
  │                           ▼                                          │
  │         ┌────────── Stage 3: WRITE ──────────┐                       │
  │         │ FileSystemSpectraWriter           │                       │
  │         │  prepends the 8-byte SPBC header  │                       │
  │         │  writes  <project>/.spectra/      │                       │
  │         │           document.bin            │                       │
  │         │                                    │                       │
  │         │  (verify: round-trip decode to    │                       │
  │         │   prove the file is actually OK)   │                       │
  │         └─────────────────┬──────────────────┘                       │
  │                           │                                          │
  │                           ▼                                          │
  │         ┌────────── Stage 4: CONFIG + STUDIO ──┐                     │
  │         │ writeSpectraConfig()                  │                    │
  │         │   → .spectra/config.json              │                    │
  │         │     { endpoint, schemaVersion:1,       │                   │
  │         │       updatedAt }                     │                    │
  │         │                                       │                    │
  │         │ copyBundledStudio()                   │                    │
  │         │   → .spectra/studio/                  │                    │
  │         │     (Next.js static export)           │                    │
  │         └───────────────────────────────────────┘                    │
  │                                                                      │
  └──────────────────────────────────────────────────────────────────────┘
```

### 2.3 What lands on disk

After a successful run, in your project root:

```
your-project/
├── src/                       (untouched)
├── package.json
├── .spectra/                  ◄── NEW (generated)
│   ├── document.bin           ◄── encoded api description
│   ├── config.json            ◄── { endpoint, schemaVersion, updatedAt }
│   └── studio/                ◄── static UI (HTML/CSS/JS, the studio)
│       ├── index.html
│       ├── _next/
│       │   └── static/...
│       └── ...
└── ...
```

The bin file format, byte‑by‑byte:

```
Offset  Size       What
──────  ─────────  ───────────────────────────────────────────────
0       4 bytes    ASCII bytes 0x53 0x50 0x42 0x43   → "SPBC"
4       4 bytes    uint32 little-endian              → version (currently 1)
8       N bytes    gzip( msgpack( Documentation ) )  → the payload
```

Three deliberate choices behind the format:
- **Magic bytes** so the studio can refuse to display a garbage file with a
  clean error (`"Not a Spectra binary document (magic header mismatch)."`).
- **gzip** because your schema library is dominated by repeating property
  names → 70–85% size reduction on typical APIs.
- **msgpack** (not JSON) because msgpack decodes ~5× faster in the browser
  and preserves `Uint8Array` and `bigint` natively.

### 2.4 What the CLI prints at the end

Two things:

1. A **report** table — paths, operations, schemas, tags, server count,
   byte count, ms taken, verify result.
2. A **Next.js‑style URL banner**:

```
──────────────────────────────────────────────────────────
▲ SPECTRA · ready

  Local:  http://localhost:3000/spectra

  →  Next steps:
  1. Mount SpectraModule.forRoot({ endpoint: '/spectra' }) in your AppModule.
  2. Start your NestJS app on port 3000.
  3. Open http://localhost:3000/spectra in a browser.
──────────────────────────────────────────────────────────
```

The banner uses port 3000 as a guess — your actual port lives in
`process.env.PORT` of your real NestJS app.

---

## 3. Where the studio comes in (the runtime NestJS module)

The `.spectra/` folder you've just produced is **inert** until something
serves it. That's what `@spectra/runtime` does. Drop it into your AppModule
and forget about it:

```ts
// your-project/src/app.module.ts
import { Module } from "@nestjs/common";
import { SpectraModule } from "@spectra/runtime";

@Module({
  imports: [
    SpectraModule.forRoot({ endpoint: "/spectra" }),
    /* ...your other modules... */
  ],
})
export class AppModule {}
```

After the app boots, the following routes exist under the configured
endpoint (default `/spectra`):

```
Method   Path                            Served by
──────   ─────────────────────────────   ──────────────────────────────────
GET      /spectra                        studio/         (static index.html)
GET      /spectra/_next/...              studio/_next/   (static JS/CSS chunks)
GET      /spectra/document.bin          SpectraController.getDocumentBin
GET      /spectra/config.json           SpectraController.getConfig
```

So the URL `http://localhost:3000/spectra` returns the studio
`index.html`. The studio's JavaScript then does two things on load:

1. `fetch("document.bin")` — gets the encoded payload.
2. `fetch("config.json")` — learns its own endpoint (used to namespace
   `localStorage` so two APIs on the same origin don't clash).

### Why serve it from your own NestJS app, not from a CDN?

Because the studio needs `document.bin` to live **under the same origin**.
Otherwise the browser's same‑origin policy blocks the `fetch()` from
reading the binary and you get a CORS error in the console. Bundling
both the studio and the bin behind one `SpectraModule` sidesteps that
entirely.

---

## 4. Inside the browser: what happens when you open `/spectra`

The studio is a vanilla Next.js app that:

1. Reads `config.json` to learn the endpoint path.
2. Asks `localStorage` for `spectra-doc:<endpoint>` (the cache).
3. If a cached doc is there → renders immediately, `fromCache=true`.
4. If not → fetches `document.bin`, **decodes in the browser**, caches it,
   then renders.

The decoder (`apps/studio/src/lib/decodeDocumentBin.ts`) is short but
exact:

```
fetch("/spectra/document.bin")
        │
        ▼
Uint8Array bytes
        │
        ├── bytes[0..4] must equal "SPBC" ──────────► throw on mismatch
        │                                          ▼
        ├── readUInt32LE(bytes, 4)  ─────────────► version (1)
        │
        ▼
pako.ungzip( bytes.subarray(8) )             ◄── decompress
        │
        ▼
@msgpack/msgpack.decode( decompressed )       ◄── into plain JS values
        │
        ▼
return { documentation, version, decodedAt }
```

The result is fed to React via the `useDocumentation()` hook in
`apps/studio/src/lib/documentationStore.ts`. Everything you see on screen —
endpoints, schemas, "Try it" panel, etc. — is rendered off that one decoded
object.

---

## 5. Save / Reset / Export — the three floating‑panel buttons

Look at the bottom‑right of the studio once it loads. You'll see a floating
card with three buttons. They all work **off the bin in the browser**,
never against the server:

```
┌─ DOCS ──────────────────────────────┐
│  ⏳ Loading…      💾 Save  ↻ Reset ⤓ Export
└─────────────────────────────────────┘
```

### Save — writes localStorage, never touches .bin

When you click **Save**, the studio takes the **currently decoded** object,
stringifies it, and writes it under the key `spectra-doc:<endpoint>`:

```
window.localStorage.setItem(
  "spectra-doc:/spectra",
  JSON.stringify({
    documentation,
    version,
    cachedAt: <timestamp>,
  })
)
```

That's it. **No network call.** The next time you load the page, step 2 of
section 4 finds this entry and skips the fetch entirely.

### Reset — drops the cache and re‑fetches the bin

Click **Reset** → `localStorage.removeItem("spectra-doc:/spectra")` → the
hook re‑runs the `fetch → decode → cache` cycle. Useful when you've
regenerated the doc and want the studio to see the new one.

### Export — downloads the decoded doc as `.json`

Click **Export** → `Blob` containing `JSON.stringify(documentation)` →
triggers a download named `documentation.json`. Pure client‑side, no server
touch.

### Why is Save a localStorage write and not a server PATCH?

Because **`document.bin` is owned by the CLI**, not the studio. The CLI is
the only thing with permission to:
- scan a NestJS project (filesystem access),
- re‑compute routes that depend on compilation,
- keep the binary format versioned.

So the data flow is one‑way:

```
                  ┌─────────────────┐
                  │  NestJS source  │
                  └────────┬────────┘
                           │  spectra generate
                           ▼
                  ┌─────────────────┐
                  │  document.bin   │  ◄── source of truth
                  └────────┬────────┘
                           │  http GET
                           ▼
                  ┌─────────────────────────┐
                  │     browser cache       │
                  │  (msgpack-decoded obj)  │
                  ├─────────────────────────┤
                  │  localStorage           │  ◄── Save button
                  │  (JSON, by endpoint)    │
                  └────────┬────────────────┘
                           │
                           ▼
                       React UI
```

`document.bin` only ever moves **downwards**. The user clicking Save, or
toggling an endpoint, or adding headers in the request editor — none of
that writes back upstream. To push a change to the bin, you change source
code and re‑run `spectra generate`.

---

## 6. How to test it locally — step by step

This is the recipe. Run it once and you've seen the whole product.

### 6.1 Prerequisites

- Node ≥ 20
- pnpm ≥ 11 (`node -v` then `corepack enable && corepack prepare pnpm@11 --activate`)
- The repo cloned and `pnpm install` already run at the root

### 6.2 One‑shot build (so the CLI is real)

The repo uses a turbo build pipeline. From the repo root:

```bash
pnpm --filter studio build
pnpm --filter "@spectra/core" build
pnpm --filter "@spectra/provider-ast" build
pnpm --filter "@spectra/provider-nestjs" build
pnpm --filter "@spectra/runtime" build
pnpm --filter "@spectra/cli" build
```

(I know, that's verbose — see the "prebuild race" caveat at the bottom for
why `pnpm build` at the root sometimes fails on this branch.)

### 6.3 The 6‑command walkthrough

Run these one at a time, watching what prints.

#### Step 1 — confirm the CLI is on the path

```bash
node packages/cli/dist/spectra.mjs --help
```

You should see `Usage: spectra <command> [options]` with `generate`
documented.

#### Step 2 — go into the example NestJS project

```bash
cd apps/example-api
ls src/
```

You should see `main.ts`, `app.module.ts`, `app.controller.ts`, `auth/`,
`cart/`, `orders/`, `products/`, `users/` — a small but real domain.

#### Step 3 — run the generator

```bash
node ../../packages/cli/dist/spectra.mjs generate
```

You should see:

```
  SPECTRA · GENERATE

  project root  /…/apps/example-api
  output        /…/apps/example-api/.spectra/document.bin
  endpoint      /spectra-docs    (auto-generated from name "@spectra/example-api")
```

…then a spinner, then a report table, then the URL banner. The endpoint
slug is derived from your `package.json` name; pass `--endpoint /spectra`
to pin it.

#### Step 4 — inspect what landed

```bash
ls -la .spectra/
cat .spectra/config.json
xxd .spectra/document.bin | head -2     # or `head -c 16 .spectra/document.bin | od -c`
```

You should see:

```
-rw-r--r--  .spectra/config.json      ~150 bytes
-rw-r--r--  .spectra/document.bin     hundreds of KB
drwxr-xr-x  .spectra/studio/         many static files
```

The `head`/`od` of `document.bin` should start with the bytes `S P B C`
(the magic header).

#### Step 5 — mount the runtime module

Edit `apps/example-api/src/app.module.ts` and add `SpectraModule`:

```ts
import { Module } from '@nestjs/common';
import { SpectraModule } from '@spectra/runtime';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    SpectraModule.forRoot({ endpoint: '/spectra' }),
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

#### Step 6 — start the server and visit the studio

```bash
cd apps/example-api
npm run start:dev               # or: pnpm --filter example-api dev
```

Then open `http://localhost:3000/spectra` in your browser.

You should see:
- The studio UI loads,
- A floating DOCS panel in the bottom‑right showing "✓ Saved" or
  "Loaded from server" status,
- The decoded API surfaces (paths, operations, schemas),
- Open DevTools → Application → Local Storage → you should see a
  `spectra-doc:/spectra` key once you click Save.

### 6.4 Round‑trip test: change a controller, regenerate

1. Add a new `@Get('ping')` method to `app.controller.ts`.
2. Stop the dev server (Ctrl‑C).
3. Re‑run `node ../../packages/cli/dist/spectra.mjs generate`.
4. Restart the dev server.
5. Hard‑reload the browser tab (Shift‑Reload) OR click **Reset** in the
   studio.
6. The new `ping` endpoint should appear in the docs.

This proves the full chain: source code → CLI scan → binary → runtime
serve → studio fetch → decode → render.

### 6.5 Where to look if something's wrong

| Symptom                                           | First place to look                              |
|---------------------------------------------------|--------------------------------------------------|
| "Failed to fetch document.bin" in console          | `apps/example-api/.spectra/` exists? server running on the same port? |
| Studio loads but shows an error card              | `.spectra/document.bin` magic bytes (`SPBC`)? file size > 8 bytes? |
| "decode failed" / "magic header mismatch"          | The bin is corrupt or wrong format. Re‑run `spectra generate`. |
| `/spectra` returns 404                            | `SpectraModule` mounted in `AppModule`? endpoint matches `config.json.endpoint`? |
| Studio shows stale data after regenerating        | Click **Reset** in the floating panel, or hard‑reload. |
| Changes to source code don't show up              | Did you re‑run `spectra generate`? The studio never re‑scans by itself. |

---

## 7. Recap of the moving parts

| Concern              | Lives in                                     | Owns                                            |
|----------------------|----------------------------------------------|-------------------------------------------------|
| **Source scanning**  | `packages/provider-nestjs`                   | AST analysis of `@Controller`, decorators, DTOs |
| **Encoding**         | `packages/core` (`encoding/encoders`)        | msgpack + gzip + magic header                   |
| **Pipeline**         | `packages/provider-nestjs/pipeline`          | wires builder → encoder → writer                |
| **CLI**              | `packages/cli`                               | `spectra generate` orchestrator                 |
| **Serving**          | `packages/runtime`                           | NestJS module that mounts studio + bin          |
| **Decoding**         | `apps/studio` (`lib/decodeDocumentBin.ts`)   | browser-side msgpack + gzip reverse             |
| **Caching (UX)**     | `apps/studio` (`lib/documentationStore.ts`)  | localStorage per endpoint                       |
| **The bin itself**   | `<your-project>/.spectra/document.bin`       | single source of truth for the UI               |

The CLI is the only writer of `document.bin`. The runtime module is the
only HTTP server of `document.bin`. The studio is the only reader. Save /
Reset / Export are purely client‑side UX. That asymmetry is the entire
architecture.

---

## Appendix A · The prebuild race (read once, then ignore)

`packages/cli/package.json` has:

```json
"prebuild": "pnpm --filter studio --filter studio... --if-present build"
```

That runs `next build` before the CLI bundles itself. Meanwhile turbo's
own `^build` dependency on the cli tries to schedule `studio#build` at the
same time. Two `next build`s on the same `.next/` directory race each other,
and `next` complains "Another next build process is already running."

**Workaround for now:** build packages individually in topological order
(see step 6.2 above). The clean fix is to delete the `prebuild` line and
let turbo handle the dependency graph on its own — happy to do that if you
want the root `pnpm build` to be reliable.

## Appendix B · Glossary

- **SPBC** — the four magic bytes that prefix every `document.bin`. Stands
  for "Spectra Bin Container".
- **tag** — a grouping label on operations (e.g. `Users`, `Auth`). Comes
  from OpenAPI / Swagger.
- **msgpack** — a binary serialisation format, similar in spirit to JSON
  but with a smaller wire size and a richer type system.
- **bin file** — shorthand for `.spectra/document.bin` throughout this repo.
- **studio** — the static site (HTML/JS/CSS) that reads and renders the
  bin file in the browser.
