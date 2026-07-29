import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname),
  /* Lets a production build run against a separate output directory while a
     dev server is using .next — set NEXT_DIST_DIR to verify a build without
     invalidating the running dev server's chunks. */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
