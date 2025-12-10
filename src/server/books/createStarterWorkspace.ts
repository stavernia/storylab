import type { PrismaClient } from "@prisma/client";

import starterTemplate from "@/data/starter-book-template.json";
import type { BookTemplate } from "@/types/bookTemplate";
import { stripHtml } from "@/utils/stripHtml";

const template: BookTemplate = starterTemplate;

export async function createStarterWorkspaceForUser(
  prisma: PrismaClient,
  userId: string,
): Promise<string | null> {
  const existingBooks = await prisma.book.count({ where: { userId, isArchived: false } });

  if (existingBooks > 0) {
    return null;
  }

  return prisma.$transaction(async (tx: any) => {
    const book = await tx.book.create({
      data: {
        title: template.book.title || "My Book",
        description: template.book.description ?? null,
        userId,
      },
    });

    const partIdByIndex = new Map<number, string>();
    for (const [index, part] of (template.parts ?? []).entries()) {
      const created = await tx.part.create({
        data: {
          title: part.title,
          sortOrder: part.sortOrder ?? index,
          notes: part.notes ?? undefined,
          bookId: book.id,
        },
      });
      partIdByIndex.set(index, created.id);
    }

    const chapterIdByIndex = new Map<number, string>();
    for (const [index, chapter] of (template.chapters ?? []).entries()) {
      const partId =
        typeof chapter.partIndex === "number" ? partIdByIndex.get(chapter.partIndex) : undefined;
      const computedWordCount = stripHtml(chapter.content ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;

      // Prisma expects customOutlineFields as JSON value, not plain object
      let customOutlineFields = chapter.customOutlineFields;
      if (customOutlineFields && typeof customOutlineFields === "object" && !Array.isArray(customOutlineFields)) {
        customOutlineFields = JSON.parse(JSON.stringify(customOutlineFields));
      }

      const created = await tx.chapter.create({
        data: {
          title: chapter.title,
          content: chapter.content ?? "",
          sortOrder: chapter.sortOrder ?? index,
          outline: chapter.outline ?? undefined,
          outlinePOV: chapter.outlinePOV ?? undefined,
          outlinePurpose: chapter.outlinePurpose ?? undefined,
          outlineEstimate: chapter.outlineEstimate ?? undefined,
          outlineGoal: chapter.outlineGoal ?? undefined,
          outlineConflict: chapter.outlineConflict ?? undefined,
          outlineStakes: chapter.outlineStakes ?? undefined,
          customOutlineFields: customOutlineFields ? JSON.stringify(customOutlineFields) : undefined,
          wordCount: chapter.wordCount ?? computedWordCount,
          lastEdited: chapter.lastEdited ? new Date(chapter.lastEdited) : undefined,
          partId,
          bookId: book.id,
        },
      });

      chapterIdByIndex.set(index, created.id);
    }

    const themeIdByIndex = new Map<number, string>();
    for (const [index, theme] of (template.themes ?? []).entries()) {
      const created = await tx.theme.create({
        data: {
          name: theme.name,
          color: theme.color,
          kind: theme.kind ?? undefined,
          source: theme.source ?? undefined,
          mode: theme.mode ?? undefined,
          sourceRefId: theme.sourceRefId ?? undefined,
          description: theme.description ?? undefined,
          aiGuide: theme.aiGuide ?? undefined,
          rowOrder: theme.rowOrder ?? index,
          isHidden: theme.isHidden ?? undefined,
          threadLabel: theme.threadLabel ?? undefined,
          bookId: book.id,
        },
      });

      themeIdByIndex.set(index, created.id);
    }

    for (const tag of template.tags ?? []) {
      await tx.tag.create({
        data: {
          name: tag.name.trim().toLowerCase(),
          color: tag.color ?? undefined,
          bookId: book.id,
        },
      });
    }

    for (const character of template.characters ?? []) {
      await tx.character.create({
        data: {
          name: character.name,
          color: character.color,
          role: character.role ?? undefined,
          notes: character.notes ?? undefined,
          bookId: book.id,
        },
      });
    }

    const boardIdByIndex = new Map<number, string>();
    for (const [index, board] of (template.boards ?? []).entries()) {
      const created = await tx.corkboardBoard.create({
        data: {
          name: board.name,
          description: board.description ?? undefined,
          sortOrder: board.sortOrder ?? index,
          bookId: book.id,
        },
      });

      boardIdByIndex.set(index, created.id);
    }

    for (const [index, card] of (template.cards ?? []).entries()) {
      const boardId =
        typeof card.boardIndex === "number" ? boardIdByIndex.get(card.boardIndex) : undefined;
      const chapterId =
        typeof card.chapterIndex === "number" ? chapterIdByIndex.get(card.chapterIndex) : undefined;
      const partId =
        typeof card.partIndex === "number" ? partIdByIndex.get(card.partIndex) : undefined;

      await tx.corkboardCard.create({
        data: {
          title: card.title,
          summary: card.summary ?? undefined,
          notes: card.notes ?? undefined,
          status: card.status ?? undefined,
          color: card.color ?? undefined,
          laneRank: card.laneRank ?? `a|starter-${String(index + 1).padStart(4, "0")}`,
          wordEstimate: card.wordEstimate ?? undefined,
          x: card.x ?? undefined,
          y: card.y ?? undefined,
          scope: card.scope ?? undefined,
          boardId,
          chapterId,
          partId,
          bookId: book.id,
        },
      });
    }

    for (const cell of template.gridCells ?? []) {
      const chapterId = chapterIdByIndex.get(cell.chapterIndex);
      const themeId = themeIdByIndex.get(cell.themeIndex);

      if (!chapterId || !themeId) {
        continue;
      }

      await tx.gridCell.create({
        data: {
          bookId: book.id,
          chapterId,
          themeId,
          presence: cell.presence ?? false,
          intensity: cell.intensity ?? 0,
          note: cell.note ?? undefined,
          threadRole: cell.threadRole ?? undefined,
        },
      });
    }

    return book.id;
  });
}
