import { prisma } from "@/lib/prisma";

export async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}
