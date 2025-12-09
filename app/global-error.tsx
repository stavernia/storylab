"use client";

import * as Sentry from "@sentry/nextjs";
import React from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // Capture the error once on mount
  React.useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
          <p className="mb-4 text-sm text-muted-foreground">
            An unexpected error occurred. The issue has been logged.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center rounded-md border border-border bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
