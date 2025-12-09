import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./sentry.config.shared";

Sentry.init({
  ...sentryConfig,
});
