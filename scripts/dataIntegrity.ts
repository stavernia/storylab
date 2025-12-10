/**
 * Read-only database integrity checks. This script surfaces mismatches,
 * orphaned rows, and cross-book inconsistencies without mutating data.
 */
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
      presence: true,
      intensity: true,
      note: true,
      threadRole: true,
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
    return { total: 0, mismatches: 0, emptyCells: 0, deletedCells: 0 };
  }

  let mismatchCount = 0;
  const emptyCellIds: string[] = [];

  for (const cell of gridCells) {
    const noteValue = cell.note?.trim() ?? "";
    const intensityValue = Number.isFinite(cell.intensity) ? Number(cell.intensity) : 0;
    const hasContent =
      noteValue !== "" || cell.presence === true || intensityValue > 0 || !!cell.threadRole;

    if (!hasContent) {
      emptyCellIds.push(cell.id);
    }

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
  if (emptyCellIds.length === 0) {
    console.log("No empty grid cells detected.");
  } else {
    console.warn(
      `${emptyCellIds.length} grid cells have no presence, intensity, note, or threadRole.`,
    );
  }

  console.log(
    `Grid summary → total: ${gridCells.length}, empty: ${emptyCellIds.length}, mismatches: ${mismatchCount}`,
  );

  return { total: gridCells.length, mismatches: mismatchCount, emptyCells: emptyCellIds.length, deletedCells: 0 };
}

function logIssue<T extends { id: string }>(
  label: string,
  items: T[],
  formatter?: (item: T) => string,
) {
  console.log(`${label}: count = ${items.length}`);
  if (items.length > 0) {
    const samples = items.slice(0, 10).map((item: T) => formatter?.(item) ?? item.id);
    console.log(`  sample: ${samples.join(", ")}${items.length > 10 ? " ..." : ""}`);
  }
}

async function checkOrphansAndCrossBookMismatches() {
  console.log("\nRelational integrity:\n---------------------");

  const [books, parts, chapters, themes, characters, boards, cards, tags, tagLinks, themeNotes, gridCells] =
    await Promise.all([
      prisma.book.findMany({ select: { id: true, isArchived: true } }),
      prisma.part.findMany({ select: { id: true, bookId: true } }),
      prisma.chapter.findMany({ select: { id: true, bookId: true, partId: true } }),
      prisma.theme.findMany({ select: { id: true, bookId: true } }),
      prisma.character.findMany({ select: { id: true, bookId: true } }),
      prisma.corkboardBoard.findMany({ select: { id: true, bookId: true } }),
      prisma.corkboardCard.findMany({
        select: { id: true, bookId: true, chapterId: true, partId: true, boardId: true },
      }),
      prisma.tag.findMany({ select: { id: true, bookId: true } }),
      prisma.tagLink.findMany({ select: { id: true, bookId: true, tagId: true, entityType: true, entityId: true } }),
      prisma.themeNote.findMany({ select: { id: true, chapterId: true, themeId: true } }),
      prisma.gridCell.findMany({ select: { id: true, bookId: true, chapterId: true, themeId: true } }),
    ]);

  const bookIds = new Set(books.map((book: (typeof books)[0]) => book.id));
  const partBook = new Map(parts.map((part: (typeof parts)[0]) => [part.id, part.bookId]));
  const chapterBook = new Map(chapters.map((chapter: (typeof chapters)[0]) => [chapter.id, chapter.bookId]));
  const themeBook = new Map(themes.map((theme: (typeof themes)[0]) => [theme.id, theme.bookId]));
  const characterBook = new Map(characters.map((character: (typeof characters)[0]) => [character.id, character.bookId]));
  const boardBook = new Map(boards.map((board: (typeof boards)[0]) => [board.id, board.bookId]));
  const cardBook = new Map(cards.map((card: (typeof cards)[0]) => [card.id, card.bookId]));
  const tagBook = new Map(tags.map((tag: (typeof tags)[0]) => [tag.id, tag.bookId]));
  const gridBook = new Map(gridCells.map((cell: (typeof gridCells)[0]) => [cell.id, cell.bookId]));

  const orphanParts = parts.filter((part: (typeof parts)[0]) => !bookIds.has(part.bookId));
  const orphanChapters = chapters.filter(
    (chapter: (typeof chapters)[0]) => !bookIds.has(chapter.bookId) || (chapter.partId && !partBook.has(chapter.partId)),
  );
  const orphanThemes = themes.filter((theme: (typeof themes)[0]) => !bookIds.has(theme.bookId));
  const orphanCharacters = characters.filter((character: (typeof characters)[0]) => !bookIds.has(character.bookId));
  const orphanBoards = boards.filter((board: (typeof boards)[0]) => !bookIds.has(board.bookId));
  const orphanCards = cards.filter(
    (card: (typeof cards)[0]) =>
      !bookIds.has(card.bookId) ||
      (card.chapterId && !chapterBook.has(card.chapterId)) ||
      (card.partId && !partBook.has(card.partId)) ||
      (card.boardId && !boardBook.has(card.boardId)),
  );
  const orphanThemeNotes = themeNotes.filter(
    (note: (typeof themeNotes)[0]) => !chapterBook.has(note.chapterId) || !themeBook.has(note.themeId),
  );
  const orphanGridCells = gridCells.filter(
    (cell: (typeof gridCells)[0]) => !bookIds.has(cell.bookId) || !chapterBook.has(cell.chapterId) || !themeBook.has(cell.themeId),
  );
  const orphanTags = tags.filter((tag: (typeof tags)[0]) => !bookIds.has(tag.bookId));
  const orphanTagLinks = tagLinks.filter((link: (typeof tagLinks)[0]) => !bookIds.has(link.bookId) || !tagBook.has(link.tagId));

  logIssue("Orphan parts (missing book)", orphanParts, (part: (typeof orphanParts)[0]) => `${part.id} → book ${part.bookId}`);
  logIssue(
    "Orphan chapters (missing book or part)",
    orphanChapters,
    (chapter: (typeof orphanChapters)[0]) => `${chapter.id} → book ${chapter.bookId}${chapter.partId ? `, part ${chapter.partId}` : ""}`,
  );
  logIssue("Orphan themes (missing book)", orphanThemes, (theme: (typeof orphanThemes)[0]) => `${theme.id} → book ${theme.bookId}`);
  logIssue("Orphan characters (missing book)", orphanCharacters, (character: (typeof orphanCharacters)[0]) => `${character.id} → book ${character.bookId}`);
  logIssue("Orphan corkboard boards (missing book)", orphanBoards, (board: (typeof orphanBoards)[0]) => `${board.id} → book ${board.bookId}`);
  logIssue(
    "Orphan corkboard cards (missing parent)",
    orphanCards,
    (card: (typeof orphanCards)[0]) =>
      `${card.id} → book ${card.bookId}${card.chapterId ? `, chapter ${card.chapterId}` : ""}${
        card.partId ? `, part ${card.partId}` : ""
      }${card.boardId ? `, board ${card.boardId}` : ""}`,
  );
  logIssue(
    "Orphan theme notes (missing chapter or theme)",
    orphanThemeNotes,
    (note: (typeof orphanThemeNotes)[0]) => `${note.id} → chapter ${note.chapterId}, theme ${note.themeId}`,
  );
  logIssue(
    "Orphan grid cells (missing book/chapter/theme)",
    orphanGridCells,
    (cell: (typeof orphanGridCells)[0]) => `${cell.id} → book ${cell.bookId}, chapter ${cell.chapterId}, theme ${cell.themeId}`,
  );
  logIssue("Orphan tags (missing book)", orphanTags, (tag: (typeof orphanTags)[0]) => `${tag.id} → book ${tag.bookId}`);
  logIssue(
    "Orphan tag links (missing book or tag)",
    orphanTagLinks,
    (link: (typeof orphanTagLinks)[0]) => `${link.id} → book ${link.bookId}, tag ${link.tagId}`,
  );

  const crossBookChapterPart = chapters.filter(
    (chapter: (typeof chapters)[0]) => chapter.partId && partBook.get(chapter.partId) !== chapter.bookId,
  );
  const crossBookCards: typeof cards = cards.filter(
    (card: (typeof cards)[0]) =>
      (card.chapterId && chapterBook.get(card.chapterId) !== card.bookId) ||
      (card.partId && partBook.get(card.partId) !== card.bookId) ||
      (card.boardId && boardBook.get(card.boardId) !== card.bookId),
  );
  const crossBookThemeNotes = themeNotes.filter((note: (typeof themeNotes)[0]) => themeBook.get(note.themeId) !== chapterBook.get(note.chapterId));
  const crossBookGridCells = gridCells.filter(
    (cell: (typeof gridCells)[0]) =>
      cell.bookId !== chapterBook.get(cell.chapterId) ||
      cell.bookId !== themeBook.get(cell.themeId) ||
      chapterBook.get(cell.chapterId) !== themeBook.get(cell.themeId),
  );
  const tagLinksWithTagMismatch = tagLinks.filter(
    (link: (typeof tagLinks)[0]) => tagBook.get(link.tagId) && tagBook.get(link.tagId) !== link.bookId,
  );

  const entityBookLookup = (type: string, id: string): string | undefined => {
    if (type === "chapter") return chapterBook.get(id);
    if (type === "theme") return themeBook.get(id);
    if (type === "character") return characterBook.get(id);
    if (type === "card") return cardBook.get(id);
    if (type === "grid_cell") return gridBook.get(id);
    return undefined;
  };

  const tagLinksWithEntityMismatch = tagLinks.filter((link: (typeof tagLinks)[0]) => {
    const entityBookId = entityBookLookup(link.entityType, link.entityId);
    return entityBookId !== undefined && entityBookId !== link.bookId;
  });

  logIssue(
    "Cross-book chapter/part mismatches",
    crossBookChapterPart,
    (chapter: (typeof crossBookChapterPart)[0]) => `${chapter.id} → chapter book ${chapter.bookId}, part book ${chapter.partId ? partBook.get(chapter.partId) : ""}`,
  );
  logIssue(
    "Cross-book corkboard cards",
    crossBookCards,
    (card: (typeof crossBookCards)[0]) =>
      `${card.id} → book ${card.bookId}${
        card.chapterId ? `, chapter book ${chapterBook.get(card.chapterId)}` : ""
      }${card.partId ? `, part book ${partBook.get(card.partId)}` : ""}${
        card.boardId ? `, board book ${boardBook.get(card.boardId)}` : ""
      }`,
  );
  logIssue(
    "Theme notes with mismatched books",
    crossBookThemeNotes,
    (note: (typeof crossBookThemeNotes)[0]) =>
      `${note.id} → chapter book ${chapterBook.get(note.chapterId)}, theme book ${themeBook.get(note.themeId)}`,
  );
  logIssue(
    "Grid cells with mismatched books",
    crossBookGridCells,
    (cell: (typeof crossBookGridCells)[0]) =>
      `${cell.id} → cell book ${cell.bookId}, chapter book ${chapterBook.get(cell.chapterId)}, theme book ${themeBook.get(cell.themeId)}`,
  );
  logIssue(
    "Tag links where tag.bookId differs",
    tagLinksWithTagMismatch,
    (link: (typeof tagLinksWithTagMismatch)[0]) => `${link.id} → link book ${link.bookId}, tag book ${tagBook.get(link.tagId)}`,
  );
  logIssue(
    "Tag links where entity book differs",
    tagLinksWithEntityMismatch,
    (link: (typeof tagLinksWithEntityMismatch)[0]) => `${link.id} → link book ${link.bookId}, entity book ${entityBookLookup(link.entityType, link.entityId)}`,
  );

  const archivedBookIds = new Set(books.filter((book: (typeof books)[0]) => book.isArchived).map((book: (typeof books)[0]) => book.id));
  const activeChildrenOfArchivedBooks = {
    parts: parts.filter((part: (typeof parts)[0]) => archivedBookIds.has(part.bookId)),
    chapters: chapters.filter((chapter: (typeof chapters)[0]) => archivedBookIds.has(chapter.bookId)),
    themes: themes.filter((theme: (typeof themes)[0]) => archivedBookIds.has(theme.bookId)),
    characters: characters.filter((character: (typeof characters)[0]) => archivedBookIds.has(character.bookId)),
    corkboardBoards: boards.filter((board: (typeof boards)[0]) => archivedBookIds.has(board.bookId)),
    corkboardCards: cards.filter((card: (typeof cards)[0]) => archivedBookIds.has(card.bookId)),
    tags: tags.filter((tag: (typeof tags)[0]) => archivedBookIds.has(tag.bookId)),
    gridCells: gridCells.filter((cell: (typeof gridCells)[0]) => archivedBookIds.has(cell.bookId)),
  };

  console.log("\nArchived book children:\n-----------------------");
  logIssue("Parts under archived books", activeChildrenOfArchivedBooks.parts);
  logIssue("Chapters under archived books", activeChildrenOfArchivedBooks.chapters);
  logIssue("Themes under archived books", activeChildrenOfArchivedBooks.themes);
  logIssue("Characters under archived books", activeChildrenOfArchivedBooks.characters);
  logIssue("Corkboard boards under archived books", activeChildrenOfArchivedBooks.corkboardBoards);
  logIssue("Corkboard cards under archived books", activeChildrenOfArchivedBooks.corkboardCards);
  logIssue("Tags under archived books", activeChildrenOfArchivedBooks.tags);
  logIssue("Grid cells under archived books", activeChildrenOfArchivedBooks.gridCells);
}

async function main() {
  await reportBookSummary();
  await checkCorkboardConsistency();
  await checkGridAndThemeConsistency();
  await checkOrphansAndCrossBookMismatches();
}

main()
  .catch((error) => {
    console.error("Integrity check failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
