import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the @spectra/core workspace package
  transpilePackages: ["@spectra/core"],
};

export default nextConfig;
