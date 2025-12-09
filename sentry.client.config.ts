import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only enable Sentry in production to keep dev clean
const isEnabled = !!dsn && process.env.NODE_ENV === "production";

if (isEnabled) {
  Sentry.init({
    dsn,
    // Tune these for your needs
    tracesSampleRate: 0.1, // 10% of transactions
    replaysSessionSampleRate: 0, // disable session replays
    replaysOnErrorSampleRate: 1.0, // but replay on error if you ever turn replays on
  });
}
