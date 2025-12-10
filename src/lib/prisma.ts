// src/lib/prisma.ts
/* eslint-disable @typescript-eslint/no-var-requires */
// Use require to avoid TypeScript named import issues with @prisma/client
const PrismaClientConstructor = require("@prisma/client").PrismaClient;

type PrismaClientConstructorType = typeof PrismaClientConstructor;

const globalForPrisma = globalThis as unknown as {
  prisma?: InstanceType<PrismaClientConstructorType>;
};

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClientConstructor({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    // Disable prepared statement caching when using Supabase connection pooler
    // The pooler (port 6543) reuses connections across clients, causing prepared
    // statement name conflicts. This is safe to disable as Prisma will re-prepare
    // statements as needed.
    ...(process.env.DATABASE_URL?.includes(":6543")
      ? { disablePreparedStatements: true }
      : {}),
  });

export const prisma = prismaInstance;

export type PrismaClientType = typeof prisma;

// Reuse the same instance in dev to avoid too many connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}
