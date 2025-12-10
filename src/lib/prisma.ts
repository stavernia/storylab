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
  });

export const prisma = prismaInstance;

export type PrismaClientType = typeof prisma;

// Reuse the same instance in dev to avoid too many connections
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}
