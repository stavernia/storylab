/**
 * Safely remove clearly invalid orphaned data. This script only deletes rows
 * that reference parents which no longer exist and can be run repeatedly.
 */
import { prisma } from "../src/lib/prisma";

function logDeletions(entity: string, ids: string[]) {
  console.log(`${entity}: deleting ${ids.length}`);
  if (ids.length > 0) {
    console.log(`  sample: ${ids.slice(0, 10).join(", ")}${ids.length > 10 ? " ..." : ""}`);
  }
}

async function cleanupOrphans() {
  const [books, parts, chapters, boards, tags, themes, characters, cards, gridCells] = await Promise.all([
    prisma.book.findMany({ select: { id: true } }),
    prisma.part.findMany({ select: { id: true, bookId: true } }),
    prisma.chapter.findMany({ select: { id: true, bookId: true, partId: true } }),
    prisma.corkboardBoard.findMany({ select: { id: true, bookId: true } }),
    prisma.tag.findMany({ select: { id: true, bookId: true } }),
    prisma.theme.findMany({ select: { id: true, bookId: true } }),
    prisma.character.findMany({ select: { id: true, bookId: true } }),
    prisma.corkboardCard.findMany({
      select: { id: true, bookId: true, chapterId: true, partId: true, boardId: true },
    }),
    prisma.gridCell.findMany({ select: { id: true, bookId: true } }),
  ]);

  const bookIds = new Set(books.map((book) => book.id));
  const partIds = new Set(parts.map((part) => part.id));
  const chapterIds = new Set(chapters.map((chapter) => chapter.id));
  const boardIds = new Set(boards.map((board) => board.id));
  const tagIds = new Set(tags.map((tag) => tag.id));
  const themeIds = new Set(themes.map((theme) => theme.id));
  const characterIds = new Set(characters.map((character) => character.id));
  const cardIds = new Set(cards.map((card) => card.id));
  const gridIds = new Set(gridCells.map((cell) => cell.id));

  const orphanParts = parts.filter((part) => !bookIds.has(part.bookId)).map((part) => part.id);
  const orphanChapters = chapters
    .filter(
      (chapter) => !bookIds.has(chapter.bookId) || (chapter.partId && !partIds.has(chapter.partId)),
    )
    .map((chapter) => chapter.id);
  const orphanThemes = themes.filter((theme) => !bookIds.has(theme.bookId)).map((theme) => theme.id);
  const orphanCharacters = characters
    .filter((character) => !bookIds.has(character.bookId))
    .map((character) => character.id);
  const orphanBoards = boards.filter((board) => !bookIds.has(board.bookId)).map((board) => board.id);
  const orphanCards = cards
    .filter(
      (card) =>
        !bookIds.has(card.bookId) ||
        (card.chapterId && !chapterIds.has(card.chapterId)) ||
        (card.partId && !partIds.has(card.partId)) ||
        (card.boardId && !boardIds.has(card.boardId)),
    )
    .map((card) => card.id);

  const orphanThemeNotes = await prisma.themeNote.findMany({
    select: { id: true, chapterId: true, themeId: true },
  });
  const orphanThemeNoteIds = orphanThemeNotes
    .filter((note) => !chapterIds.has(note.chapterId) || !themeIds.has(note.themeId))
    .map((note) => note.id);

  const orphanTagLinks = await prisma.tagLink.findMany({
    select: { id: true, tagId: true, bookId: true, entityId: true, entityType: true },
  });
  const orphanTagLinkIds = orphanTagLinks
    .filter(
      (link) =>
        !tagIds.has(link.tagId) ||
        !bookIds.has(link.bookId) ||
        (link.entityType === "chapter" && !chapterIds.has(link.entityId)) ||
        (link.entityType === "theme" && !themeIds.has(link.entityId)) ||
        (link.entityType === "character" && !characterIds.has(link.entityId)) ||
        (link.entityType === "card" && !cardIds.has(link.entityId)) ||
        (link.entityType === "grid_cell" && !gridIds.has(link.entityId)),
    )
    .map((link) => link.id);

  const orphanGridCells = gridCells
    .filter((cell) => !bookIds.has(cell.bookId))
    .map((cell) => cell.id);

  logDeletions("Parts with missing book", orphanParts);
  logDeletions("Chapters with missing book/part", orphanChapters);
  logDeletions("Themes with missing book", orphanThemes);
  logDeletions("Characters with missing book", orphanCharacters);
  logDeletions("Boards with missing book", orphanBoards);
  logDeletions("Cards with missing parents", orphanCards);
  logDeletions("Theme notes with missing chapter/theme", orphanThemeNoteIds);
  logDeletions("Tag links with missing references", orphanTagLinkIds);
  logDeletions("Grid cells with missing book", orphanGridCells);

  await prisma.$transaction([
    prisma.part.deleteMany({ where: { id: { in: orphanParts } } }),
    prisma.chapter.deleteMany({ where: { id: { in: orphanChapters } } }),
    prisma.theme.deleteMany({ where: { id: { in: orphanThemes } } }),
    prisma.character.deleteMany({ where: { id: { in: orphanCharacters } } }),
    prisma.corkboardBoard.deleteMany({ where: { id: { in: orphanBoards } } }),
    prisma.corkboardCard.deleteMany({ where: { id: { in: orphanCards } } }),
    prisma.themeNote.deleteMany({ where: { id: { in: orphanThemeNoteIds } } }),
    prisma.tagLink.deleteMany({ where: { id: { in: orphanTagLinkIds } } }),
    prisma.gridCell.deleteMany({ where: { id: { in: orphanGridCells } } }),
  ]);
}

async function main() {
  await cleanupOrphans();
}

main()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
