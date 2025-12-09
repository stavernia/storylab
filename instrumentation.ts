import * as Sentry from "@sentry/nextjs";
import { sentryConfig } from "./sentry.config.shared";

export async function register() {
  Sentry.init({
    ...sentryConfig,
  });
}
