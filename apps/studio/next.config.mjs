/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the @spectra/core workspace package so its TS
  // imports resolve at build time without any extra build steps.
  transpilePackages: ["@spectra/core"],

  // Static export — produces a folder of plain HTML/CSS/JS the
  // CLI can copy into .spectra/studio/ and the runtime NestJS
  // module can serve as-is. No Node server needed in production.
  output: "export",

  // Mount the studio at a non-root URL prefix when SPECTRA_BASE_PATH
  // is set in the environment (the CLI does this on `spectra generate`
  // — see packages/cli/src/pipeline/rewrite-studio-paths.ts). The
  // prefix is baked into every `/_next/...` reference in the compiled
  // HTML, every `/_next/` literal inside the compiled JS chunks
  // (Turbopack runtime + chunk loader), and the favicon/<base href>
  // tags. Without this, the client router ignores <base href> and
  // requests host-relative `/_next/...` URLs that miss the endpoint.
  //
  // Empty string keeps the existing root-prefixed behavior so the
  // studio still works as a top-level static export.
  basePath: process.env.SPECTRA_BASE_PATH || "",

  // Next.js's image optimization pipeline only runs on a Node
  // server, so when we go static-export we have to skip it.
  images: { unoptimized: true },

  // Emit /index.html for every route so any static-file server
  // (including serve-static) resolves directory paths correctly.
  trailingSlash: true,
};

export default nextConfig;
