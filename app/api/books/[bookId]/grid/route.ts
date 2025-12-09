import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

async function loadScopedChapterAndThemeIds(bookId: string, userId: string) {
  const [chapters, themes] = await Promise.all([
    prisma.chapter.findMany({
      where: { bookId, book: { userId } },
      select: { id: true },
    }),
    prisma.theme.findMany({
      where: { bookId, book: { userId } },
      select: { id: true },
    }),
  ]);

  return {
    chapterIds: new Set(chapters.map((chapter) => chapter.id)),
    themeIds: new Set(themes.map((theme) => theme.id)),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params;
    const user = await requireUser();

    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const cells = await prisma.gridCell.findMany({
      where: {
        bookId,
        book: { userId: user.id },
        chapter: { bookId, book: { userId: user.id } },
        theme: { bookId, book: { userId: user.id } },
      },
    });

    return NextResponse.json({ cells });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params;
    const user = await requireUser();

    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const body = await request.json();
    const rawCells = Array.isArray(body?.cells)
      ? body.cells
      : body
        ? [body]
        : [];

    const { chapterIds, themeIds } = await loadScopedChapterAndThemeIds(
      bookId,
      user.id,
    );

    const invalidCells: Array<{ chapterId: string; themeId: string }> = [];
    const sanitizedCells: Array<{
      chapterId: string;
      themeId: string;
      presence: boolean;
      intensity: number;
      note?: string;
      threadRole?: string;
    }> = [];

    for (const cell of rawCells) {
      if (!cell) continue;

      const chapterId = typeof cell.chapterId === "string" ? cell.chapterId : "";
      const themeId = typeof cell.themeId === "string" ? cell.themeId : "";

      if (!chapterId || !themeId || !chapterIds.has(chapterId) || !themeIds.has(themeId)) {
        invalidCells.push({ chapterId, themeId });
        continue;
      }

      const presence = typeof cell.presence === "boolean" ? cell.presence : false;
      const intensityValue = Number.isFinite(cell.intensity) ? Math.round(cell.intensity) : 0;
      const intensity = Math.max(0, Math.min(3, intensityValue));
      const note = typeof cell.note === "string" ? cell.note : undefined;
      const threadRole = typeof cell.threadRole === "string" ? cell.threadRole : undefined;

      sanitizedCells.push({
        chapterId,
        themeId,
        presence,
        intensity,
        note,
        threadRole,
      });
    }

    if (invalidCells.length > 0) {
      return NextResponse.json(
        { error: "Invalid grid cells for this book", invalidCells },
        { status: 400 },
      );
    }

    if (sanitizedCells.length === 0) {
      return NextResponse.json({ cells: [] });
    }

    const cells = await prisma.$transaction(async (tx) => {
      const updatedCells = [] as Awaited<ReturnType<typeof tx.gridCell.upsert>>[];

      for (const cell of sanitizedCells) {
        const hasContent =
          (cell.note?.trim() ?? "") !== "" ||
          cell.presence === true ||
          (cell.intensity ?? 0) > 0 ||
          !!cell.threadRole;

        if (!hasContent) {
          await tx.gridCell.deleteMany({
            where: {
              bookId,
              chapterId: cell.chapterId,
              themeId: cell.themeId,
              book: { userId: user.id },
              chapter: { bookId, book: { userId: user.id } },
              theme: { bookId, book: { userId: user.id } },
            },
          });
          continue;
        }

        const updated = await tx.gridCell.upsert({
          where: {
            bookId_chapterId_themeId: {
              bookId,
              chapterId: cell.chapterId,
              themeId: cell.themeId,
            },
          },
          update: {
            presence: cell.presence,
            intensity: cell.intensity,
            note: cell.note ?? null,
            threadRole: cell.threadRole,
          },
          create: {
            bookId,
            chapterId: cell.chapterId,
            themeId: cell.themeId,
            presence: cell.presence,
            intensity: cell.intensity,
            note: cell.note ?? null,
            threadRole: cell.threadRole,
          },
        });

        updatedCells.push(updated);
      }

      return updatedCells;
    });

    return NextResponse.json({ cells });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
