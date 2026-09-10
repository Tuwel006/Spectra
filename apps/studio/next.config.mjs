/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the @spectra/core workspace package so its TS
  // imports resolve at build time without any extra build steps.
  transpilePackages: ["@spectra/core"],

  // Static export — produces a folder of plain HTML/CSS/JS the
  // CLI can copy into .spectra/studio/ and the runtime NestJS
  // module can serve as-is. No Node server needed in production.
  output: "export",

  // Next.js's image optimization pipeline only runs on a Node
  // server, so when we go static-export we have to skip it.
  images: { unoptimized: true },

  // Emit /index.html for every route so any static-file server
  // (including serve-static) resolves directory paths correctly.
  trailingSlash: true,
};

export default nextConfig;
