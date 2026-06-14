import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist optionally references Node's `canvas`; not needed in the browser.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    // xlsx / mammoth optionally reference Node core modules in the browser build.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, stream: false };
    return config;
  },
};

export default nextConfig;
