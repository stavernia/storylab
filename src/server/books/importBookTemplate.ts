import type { BookTemplate } from "@/types/bookTemplate";
import { prisma as defaultPrisma } from "@/lib/prisma";

type PrismaClientType = typeof defaultPrisma;

/**
 * Validates that a book template has all required fields
 */
function validateBookTemplate(template: unknown): template is BookTemplate {
  if (!template || typeof template !== "object") {
    throw new Error("Invalid template: must be an object");
  }

  const t = template as Record<string, unknown>;

  // Check required book field
  if (!t.book || typeof t.book !== "object") {
    throw new Error("Invalid template: missing 'book' field");
  }

  const book = t.book as Record<string, unknown>;
  if (typeof book.title !== "string") {
    throw new Error("Invalid template: book.title must be a string");
  }

  // Validate optional arrays if present
  if (t.chapters !== undefined && !Array.isArray(t.chapters)) {
    throw new Error("Invalid template: chapters must be an array");
  }

  if (t.parts !== undefined && !Array.isArray(t.parts)) {
    throw new Error("Invalid template: parts must be an array");
  }

  if (t.themes !== undefined && !Array.isArray(t.themes)) {
    throw new Error("Invalid template: themes must be an array");
  }

  if (t.characters !== undefined && !Array.isArray(t.characters)) {
    throw new Error("Invalid template: characters must be an array");
  }

  if (t.tags !== undefined && !Array.isArray(t.tags)) {
    throw new Error("Invalid template: tags must be an array");
  }

  if (t.boards !== undefined && !Array.isArray(t.boards)) {
    throw new Error("Invalid template: boards must be an array");
  }

  if (t.cards !== undefined && !Array.isArray(t.cards)) {
    throw new Error("Invalid template: cards must be an array");
  }

  if (t.gridCells !== undefined && !Array.isArray(t.gridCells)) {
    throw new Error("Invalid template: gridCells must be an array");
  }

  return true;
}

/**
 * Imports a book template, replacing all existing book data
 * except for title and description
 */
export async function importBookTemplate(
  prisma: PrismaClientType,
  bookId: string,
  userId: string,
  templateInput: unknown,
): Promise<void> {
  // Validate the template structure
  validateBookTemplate(templateInput);
  
  // After validation, we know it's a BookTemplate
  const template = templateInput as BookTemplate;

  // Verify book exists and belongs to user
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { userId: true },
  });

  if (!book) {
    throw new Error("Book not found");
  }

  if (book.userId !== userId) {
    throw new Error("Unauthorized: book does not belong to user");
  }

  // Perform import in a transaction
  await prisma.$transaction(async (tx: PrismaClientType) => {
    // Delete all existing related data
    await tx.gridCell.deleteMany({ where: { bookId } });
    await tx.corkboardCard.deleteMany({ where: { bookId } });
    await tx.corkboardBoard.deleteMany({ where: { bookId } });
    await tx.tagLink.deleteMany({ where: { bookId } });
    await tx.tag.deleteMany({ where: { bookId } });
    await tx.character.deleteMany({ where: { bookId } });
    await tx.chapter.deleteMany({ where: { bookId } });
    await tx.part.deleteMany({ where: { bookId } });
    await tx.theme.deleteMany({ where: { bookId } });

    // Import parts
    const partIdByIndex = new Map<number, string>();
    if (template.parts && template.parts.length > 0) {
      for (let i = 0; i < template.parts.length; i++) {
        const part = template.parts[i];
        const created = await tx.part.create({
          data: {
            bookId,
            title: part.title,
            sortOrder: part.sortOrder ?? i,
            notes: part.notes ?? null,
          },
        });
        partIdByIndex.set(i, created.id);
      }
    }

    // Import chapters
    const chapterIdByIndex = new Map<number, string>();
    if (template.chapters && template.chapters.length > 0) {
      for (let i = 0; i < template.chapters.length; i++) {
        const chapter = template.chapters[i];
        const partId =
          chapter.partIndex !== null && chapter.partIndex !== undefined
            ? partIdByIndex.get(chapter.partIndex) ?? null
            : null;

        const created = await tx.chapter.create({
          data: {
            bookId,
            title: chapter.title,
            content: chapter.content ?? "",
            outline: chapter.outline ?? null,
            outlinePOV: chapter.outlinePOV ?? null,
            outlinePurpose: chapter.outlinePurpose ?? null,
            outlineEstimate: chapter.outlineEstimate ?? null,
            outlineGoal: chapter.outlineGoal ?? null,
            outlineConflict: chapter.outlineConflict ?? null,
            outlineStakes: chapter.outlineStakes ?? null,
            customOutlineFields: chapter.customOutlineFields as any ?? null,
            sortOrder: chapter.sortOrder ?? i,
            wordCount: chapter.wordCount ?? 0,
            lastEdited: chapter.lastEdited ? new Date(chapter.lastEdited) : null,
            partId,
          },
        });
        chapterIdByIndex.set(i, created.id);
      }
    }

    // Import themes
    const themeIdByIndex = new Map<number, string>();
    if (template.themes && template.themes.length > 0) {
      for (let i = 0; i < template.themes.length; i++) {
        const theme = template.themes[i];
        const created = await tx.theme.create({
          data: {
            bookId,
            name: theme.name,
            color: theme.color,
            kind: theme.kind ?? null,
            source: theme.source ?? null,
            mode: theme.mode ?? null,
            sourceRefId: theme.sourceRefId ?? null,
            description: theme.description ?? null,
            aiGuide: theme.aiGuide ?? null,
            rowOrder: theme.rowOrder ?? i,
            isHidden: theme.isHidden ?? false,
            threadLabel: theme.threadLabel ?? null,
          },
        });
        themeIdByIndex.set(i, created.id);
      }
    }

    // Import tags
    if (template.tags && template.tags.length > 0) {
      await tx.tag.createMany({
        data: template.tags.map((tag) => ({
          bookId,
          name: tag.name,
          color: tag.color ?? "#94a3b8",
        })),
      });
    }

    // Import characters
    if (template.characters && template.characters.length > 0) {
      await tx.character.createMany({
        data: template.characters.map((character) => ({
          bookId,
          name: character.name,
          color: character.color,
          role: character.role ?? null,
          notes: character.notes ?? null,
        })),
      });
    }

    // Import corkboard boards
    const boardIdByIndex = new Map<number, string>();
    if (template.boards && template.boards.length > 0) {
      for (let i = 0; i < template.boards.length; i++) {
        const board = template.boards[i];
        const created = await tx.corkboardBoard.create({
          data: {
            bookId,
            name: board.name,
            description: board.description ?? null,
            sortOrder: board.sortOrder ?? i,
          },
        });
        boardIdByIndex.set(i, created.id);
      }
    }

    // Import corkboard cards
    if (template.cards && template.cards.length > 0) {
      for (const card of template.cards) {
        const boardId =
          card.boardIndex !== null && card.boardIndex !== undefined
            ? boardIdByIndex.get(card.boardIndex) ?? null
            : null;
        const chapterId =
          card.chapterIndex !== null && card.chapterIndex !== undefined
            ? chapterIdByIndex.get(card.chapterIndex) ?? null
            : null;
        const partId =
          card.partIndex !== null && card.partIndex !== undefined
            ? partIdByIndex.get(card.partIndex) ?? null
            : null;

        await tx.corkboardCard.create({
          data: {
            bookId,
            boardId,
            chapterId,
            partId,
            title: card.title,
            summary: card.summary ?? null,
            notes: card.notes ?? null,
            status: card.status ?? null,
            color: card.color ?? null,
            laneRank: card.laneRank ?? "0|aaaaaa",
            wordEstimate: card.wordEstimate ?? null,
            x: card.x ?? null,
            y: card.y ?? null,
            scope: card.scope ?? "book",
          },
        });
      }
    }

    // Import grid cells
    if (template.gridCells && template.gridCells.length > 0) {
      for (const cell of template.gridCells) {
        const chapterId = chapterIdByIndex.get(cell.chapterIndex);
        const themeId = themeIdByIndex.get(cell.themeIndex);

        if (chapterId && themeId) {
          await tx.gridCell.create({
            data: {
              bookId,
              chapterId,
              themeId,
              presence: cell.presence ?? false,
              intensity: cell.intensity ?? 0,
              note: cell.note ?? null,
              threadRole: cell.threadRole ?? null,
            },
          });
        }
      }
    }

    // Update book description from template
    if (template.book.description !== undefined) {
      await tx.book.update({
        where: { id: bookId },
        data: { description: template.book.description },
      });
    }
  });
}
