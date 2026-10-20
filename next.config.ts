import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Speed: keep prefetched + visited pages in the client router cache so
  // switching pages is instant (page data is live via Convex anyway).
  experimental: {
    staleTimes: { dynamic: 300, static: 600 },
    optimizePackageImports: ["lucide-react"],
  },
  webpack: (config) => {
    // pdfjs-dist optionally references Node's `canvas`; not needed in the browser.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    // xlsx / mammoth optionally reference Node core modules in the browser build.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, stream: false };
    return config;
  },
};

export default nextConfig;
