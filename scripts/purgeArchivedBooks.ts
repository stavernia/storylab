import { prisma } from "../src/lib/prisma";

async function purgeArchivedBooks() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const booksToDelete = await prisma.book.findMany({
    where: {
      isArchived: true,
      archivedAt: { lt: cutoff },
    },
    select: { id: true, title: true },
  });

  if (booksToDelete.length === 0) {
    console.log("No archived books older than 30 days found.");
    return;
  }

  for (const book of booksToDelete) {
    await prisma.book.delete({ where: { id: book.id } });
    console.log(`Deleted archived book: ${book.title} (${book.id})`);
  }
}

async function main() {
  await purgeArchivedBooks();
}

main()
  .catch((error) => {
    console.error("Purge failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
