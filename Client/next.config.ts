import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  images: {
    remotePatterns: [
      // AWS S3 buckets (any bucket / region)
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      // RaiseAPlayer CDN
      {
        protocol: "https",
        hostname: "cdn.raiseaplayer.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print Sentry build output in CI
  silent: !process.env.CI,

  // Upload wider set of source maps
  widenClientFileUpload: true,

  // Hide source maps from the client bundle
  sourcemaps: { disable: true },

  // Suppress Sentry SDK logger in production to keep console clean
  disableLogger: true,
});
