import type { PrismaClient } from "@prisma/client";

import type { BookTemplate } from "@/types/bookTemplate";

export async function exportBookTemplate(
  prisma: PrismaClient,
  bookId: string,
): Promise<BookTemplate> {
  const [book, parts, chapters, themes, tags, characters, boards, cards, gridCells] =
    await prisma.$transaction([
      prisma.book.findUnique({
        where: { id: bookId },
        select: { title: true, description: true, chapterNumbering: true },
      }),
      prisma.part.findMany({ where: { bookId }, orderBy: { sortOrder: "asc" } }),
      prisma.chapter.findMany({ where: { bookId }, orderBy: { sortOrder: "asc" } }),
      prisma.theme.findMany({ where: { bookId }, orderBy: { rowOrder: "asc" } }),
      prisma.tag.findMany({ where: { bookId }, orderBy: { name: "asc" } }),
      prisma.character.findMany({ where: { bookId }, orderBy: { name: "asc" } }),
      prisma.corkboardBoard.findMany({ where: { bookId }, orderBy: { sortOrder: "asc" } }),
      prisma.corkboardCard.findMany({ where: { bookId }, orderBy: { laneRank: "asc" } }),
      prisma.gridCell.findMany({ where: { bookId } }),
    ]);

  if (!book) {
    throw new Error("Book not found");
  }

  const partIndexById = new Map<string, number>();
  const partTemplates = parts.map((part, index) => {
    partIndexById.set(part.id, index);
    return {
      title: part.title,
      sortOrder: part.sortOrder,
      notes: part.notes,
    };
  });

  const chapterIndexById = new Map<string, number>();
  const chapterTemplates = chapters.map((chapter, index) => {
    chapterIndexById.set(chapter.id, index);
    return {
      title: chapter.title,
      content: chapter.content,
      outline: chapter.outline,
      outlinePOV: chapter.outlinePOV,
      outlinePurpose: chapter.outlinePurpose,
      outlineEstimate: chapter.outlineEstimate ?? undefined,
      outlineGoal: chapter.outlineGoal,
      outlineConflict: chapter.outlineConflict,
      outlineStakes: chapter.outlineStakes,
      customOutlineFields: chapter.customOutlineFields as Record<string, unknown> | null,
      sortOrder: chapter.sortOrder,
      wordCount: chapter.wordCount,
      lastEdited: chapter.lastEdited?.toISOString(),
      partIndex: chapter.partId ? partIndexById.get(chapter.partId) ?? null : null,
    };
  });

  const themeIndexById = new Map<string, number>();
  const themeTemplates = themes.map((theme, index) => {
    themeIndexById.set(theme.id, index);
    return {
      name: theme.name,
      color: theme.color,
      kind: theme.kind,
      source: theme.source,
      mode: theme.mode,
      sourceRefId: theme.sourceRefId,
      description: theme.description,
      aiGuide: theme.aiGuide,
      rowOrder: theme.rowOrder,
      isHidden: theme.isHidden,
      threadLabel: theme.threadLabel,
    };
  });

  const boardIndexById = new Map<string, number>();
  const boardTemplates = boards.map((board, index) => {
    boardIndexById.set(board.id, index);
    return {
      name: board.name,
      description: board.description,
      sortOrder: board.sortOrder ?? index,
    };
  });

  const tagTemplates = tags.map((tag) => ({ name: tag.name, color: tag.color }));

  const characterTemplates = characters.map((character) => ({
    name: character.name,
    color: character.color,
    role: character.role,
    notes: character.notes,
  }));

  const cardTemplates = cards.map((card) => ({
    title: card.title,
    summary: card.summary,
    notes: card.notes,
    status: card.status,
    color: card.color,
    laneRank: card.laneRank,
    wordEstimate: card.wordEstimate ?? undefined,
    x: card.x ?? undefined,
    y: card.y ?? undefined,
    scope: card.scope,
    boardIndex: card.boardId ? boardIndexById.get(card.boardId) ?? null : null,
    chapterIndex: card.chapterId
      ? chapterIndexById.get(card.chapterId) ?? null
      : null,
    partIndex: card.partId ? partIndexById.get(card.partId) ?? null : null,
  }));

  const gridCellTemplates = gridCells
    .map((cell) => {
      const chapterIndex = chapterIndexById.get(cell.chapterId);
      const themeIndex = themeIndexById.get(cell.themeId);

      if (chapterIndex === undefined || themeIndex === undefined) {
        return null;
      }

      return {
        chapterIndex,
        themeIndex,
        presence: cell.presence,
        intensity: cell.intensity,
        note: cell.note,
        threadRole: cell.threadRole,
      };
    })
    .filter((cell): cell is NonNullable<typeof cell> => Boolean(cell));

  return {
    book: {
      title: book.title,
      description: book.description,
      chapterNumbering: book.chapterNumbering,
    },
    parts: partTemplates,
    chapters: chapterTemplates,
    themes: themeTemplates,
    tags: tagTemplates,
    characters: characterTemplates,
    boards: boardTemplates,
    cards: cardTemplates,
    gridCells: gridCellTemplates,
  };
}
