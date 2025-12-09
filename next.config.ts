import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: false,
  turbopack: {
    // Explicitly set the project root to avoid multi-lockfile warnings in the parent workspace
    root: path.join(__dirname),
  },
};

const sentryWebpackPluginOptions = {
  // You can keep this minimal; you can refine later if you want releases, etc.
  silent: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
