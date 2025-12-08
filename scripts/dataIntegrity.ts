import { prisma } from "../src/lib/prisma";

type CountSummary = {
  id: string;
  title: string;
  _count: {
    parts: number;
    chapters: number;
    corkboardBoards: number;
    corkboardCards: number;
    themes: number;
    tags: number;
    gridCells: number;
  };
};

async function reportBookSummary() {
  const books: CountSummary[] = await prisma.book.findMany({
    select: {
      id: true,
      title: true,
      _count: {
        select: {
          parts: true,
          chapters: true,
          corkboardBoards: true,
          corkboardCards: true,
          themes: true,
          tags: true,
          gridCells: true,
        },
      },
    },
  });

  console.log("\nBook content summary:\n----------------------");
  if (books.length === 0) {
    console.log("No books found.");
    return;
  }

  for (const book of books) {
    const counts = book._count;
    console.log(`- ${book.title} (${book.id})`);
    console.log(
      `  parts: ${counts.parts}, chapters: ${counts.chapters}, boards: ${counts.corkboardBoards}, cards: ${counts.corkboardCards}, themes: ${counts.themes}, tags: ${counts.tags}, grid cells: ${counts.gridCells}`,
    );
  }
}

async function checkCorkboardConsistency() {
  console.log("\nCorkboard consistency:\n----------------------");

  const cards = await prisma.corkboardCard.findMany({
    select: {
      id: true,
      bookId: true,
      boardId: true,
      board: {
        select: {
          id: true,
          name: true,
          bookId: true,
        },
      },
    },
  });

  if (cards.length === 0) {
    console.log("No corkboard cards found.");
  }

  let mismatchCount = 0;
  for (const card of cards) {
    if (card.board && card.bookId !== card.board.bookId) {
      mismatchCount += 1;
      console.warn(
        `Card ${card.id} has bookId ${card.bookId} but board ${card.board.id} (${card.board.name}) has bookId ${card.board.bookId}`,
      );
    }
  }

  const boards = await prisma.corkboardBoard.findMany({
    select: {
      id: true,
      cards: { select: { id: true } },
    },
  });

  const cardReferences = new Map<string, string[]>();
  for (const board of boards) {
    for (const card of board.cards) {
      const entries = cardReferences.get(card.id) || [];
      entries.push(board.id);
      cardReferences.set(card.id, entries);
    }
  }

  let duplicateLinks = 0;
  for (const [cardId, boardIds] of cardReferences) {
    if (boardIds.length > 1) {
      duplicateLinks += 1;
      console.warn(
        `Card ${cardId} is linked to multiple boards: ${boardIds.join(", ")}`,
      );
    }
  }

  if (mismatchCount === 0) {
    console.log("No card/book mismatches detected.");
  }
  if (duplicateLinks === 0) {
    console.log("No duplicate card-board links detected.");
  }
}

async function checkGridAndThemeConsistency() {
  console.log("\nGrid and theme relationships:\n-----------------------------");

  const gridCells = await prisma.gridCell.findMany({
    select: {
      id: true,
      bookId: true,
      chapter: {
        select: {
          id: true,
          bookId: true,
          title: true,
        },
      },
      theme: {
        select: {
          id: true,
          bookId: true,
          name: true,
        },
      },
    },
  });

  if (gridCells.length === 0) {
    console.log("No grid cells found.");
    return;
  }

  let mismatchCount = 0;

  for (const cell of gridCells) {
    if (cell.chapter && cell.bookId !== cell.chapter.bookId) {
      mismatchCount += 1;
      console.warn(
        `GridCell ${cell.id} bookId ${cell.bookId} does not match chapter ${cell.chapter.id} bookId ${cell.chapter.bookId}`,
      );
    }

    if (cell.theme && cell.bookId !== cell.theme.bookId) {
      mismatchCount += 1;
      console.warn(
        `GridCell ${cell.id} bookId ${cell.bookId} does not match theme ${cell.theme.id} bookId ${cell.theme.bookId}`,
      );
    }

    if (
      cell.chapter &&
      cell.theme &&
      cell.chapter.bookId !== cell.theme.bookId
    ) {
      mismatchCount += 1;
      console.warn(
        `Theme ${cell.theme.id} (${cell.theme.name}) is linked to chapter ${cell.chapter.id} (${cell.chapter.title}) with a different bookId (${cell.theme.bookId} vs ${cell.chapter.bookId})`,
      );
    }
  }

  if (mismatchCount === 0) {
    console.log("No grid/theme book mismatches detected.");
  }
}

async function main() {
  await reportBookSummary();
  await checkCorkboardConsistency();
  await checkGridAndThemeConsistency();
}

main()
  .catch((error) => {
    console.error("Integrity check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
