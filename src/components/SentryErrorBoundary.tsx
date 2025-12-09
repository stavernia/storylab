"use client";

import * as Sentry from "@sentry/nextjs";
import type { ReactNode } from "react";

export function SentryErrorBoundary({ children }: { children: ReactNode }) {
  return <Sentry.ErrorBoundary fallback={null}>{children}</Sentry.ErrorBoundary>;
}
