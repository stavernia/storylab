export async function register() {
  // Initialize Sentry on the Node.js server runtime only.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}