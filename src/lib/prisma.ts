// Avoid importing PrismaClient types directly here because some build
// environments (and certain bundler/type resolutions) can expose a
// browser-targeted entry that doesn't export the server PrismaClient
// type. Use a runtime require and keep the singleton on `global`.

declare global {
  // Keep the global variable untyped to avoid TypeScript export issues
  // during builds where `@prisma/client`'s typings are not available.
  // We still get a runtime PrismaClient instance via require.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var prisma: any | undefined;
}

// Require at runtime to avoid TypeScript resolving an incorrect export
// entry for `@prisma/client` during static analysis.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const PrismaClientCtor: any = require("@prisma/client").PrismaClient;

export const prisma = global.prisma || new PrismaClientCtor();

if (process.env.NODE_ENV !== "production") {
  // attach for hot-reload / dev reuse
  // eslint-disable-next-line no-undef
  global.prisma = prisma;
}
