// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only active in production — never sends dev noise to Sentry
  enabled: process.env.NODE_ENV === "production",

  environment: process.env.NODE_ENV,

  integrations: [Sentry.replayIntegration()],

  // 20% of transactions traced — 1.0 would bill for every request
  tracesSampleRate: 0.2,

  enableLogs: true,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Never forward PII (names, emails, IPs) to a third-party service
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
