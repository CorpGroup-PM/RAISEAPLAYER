/**
 * Structured client-side logger (B-10-3).
 *
 * - In development: writes to the browser console at the appropriate level.
 * - In production : suppresses info/warn; always forwards errors to Sentry.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("Campaign loaded", { id });
 *   logger.warn("Slow network detected");
 *   logger.error("Payment failed", err, { fundraiserId });
 */

const isDev = process.env.NODE_ENV === "development";

function captureToSentry(err: unknown, ctx?: object) {
  // Dynamically import Sentry to avoid bundling it on every page
  import("@sentry/nextjs").then(({ captureException, setContext }) => {
    if (ctx) setContext("extra", ctx as Record<string, unknown>);
    captureException(err instanceof Error ? err : new Error(String(err)));
  });
}

export const logger = {
  info(msg: string, ctx?: object): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(`[INFO] ${msg}`, ctx ?? "");
    }
  },

  warn(msg: string, ctx?: object): void {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${msg}`, ctx ?? "");
    }
  },

  error(msg: string, err?: unknown, ctx?: object): void {
    // Always log errors — console.error is allowed by ESLint rule
    console.error(`[ERROR] ${msg}`, err ?? "", ctx ?? "");
    captureToSentry(err ?? new Error(msg), ctx);
  },
};
