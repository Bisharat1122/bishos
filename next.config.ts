import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Speed: pages are static client shells (all data is live via Convex), so
  // keep prefetched + visited payloads in the client router cache for 30 min —
  // switching pages never waits on the network. Warmup re-prefetches.
  experimental: {
    staleTimes: { dynamic: 1800, static: 1800 },
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
