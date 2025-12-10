import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

const isEnabled = !!dsn && process.env.NODE_ENV === "production";

if (isEnabled) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
