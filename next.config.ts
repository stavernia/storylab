import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: false,
  turbopack: {
    // Explicitly set the project root to avoid multi-lockfile warnings in the parent workspace
    root: path.join(__dirname),
  },
};

export default withSentryConfig(nextConfig, { silent: true }, { hideSourcemaps: true });
