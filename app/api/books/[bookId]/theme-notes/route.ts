import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { assertBookAccess } from "@/server/auth/bookAccess";

async function assertChapterAccess(chapterId: string, bookId: string, userId: string) {
  return prisma.chapter.findFirst({ where: { id: chapterId, bookId, book: { userId } } });
}

async function assertThemeAccess(themeId: string, bookId: string, userId: string) {
  return prisma.theme.findFirst({ where: { id: themeId, bookId, book: { userId } } });
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

    const themeNotes = await prisma.themeNote.findMany({
      where: {
        chapter: { bookId, book: { userId: user.id } },
        theme: { bookId, book: { userId: user.id } },
      },
    });

    return NextResponse.json({ themeNotes });
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

    const body = await request.json();
    const chapterId = typeof body.chapterId === "string" ? body.chapterId : "";
    const themeId = typeof body.themeId === "string" ? body.themeId : "";

    if (!chapterId || !themeId) {
      return NextResponse.json({ error: "chapterId and themeId are required" }, { status: 400 });
    }

    const [chapter, theme] = await Promise.all([
      assertChapterAccess(chapterId, bookId, user.id),
      assertThemeAccess(themeId, bookId, user.id),
    ]);

    if (!chapter || !theme) {
      return NextResponse.json({ error: "Theme note not found" }, { status: 404 });
    }

    const note = typeof body.note === "string" ? body.note : "";
    const presence = typeof body.presence === "boolean" ? body.presence : false;
    const intensity = Number.isFinite(body.intensity) ? body.intensity : 0;
    const threadRole = typeof body.threadRole === "string" ? body.threadRole : undefined;

    const hasContent =
      note.trim() !== "" || presence === true || (intensity ?? 0) > 0 || !!threadRole;

    if (!hasContent) {
      await prisma.themeNote.deleteMany({
        where: {
          chapterId,
          themeId,
          chapter: { bookId, book: { userId: user.id } },
          theme: { bookId, book: { userId: user.id } },
        },
      });

      return NextResponse.json({ success: true, deleted: true });
    }

    const themeNote = await prisma.themeNote.upsert({
      where: { chapterId_themeId: { chapterId, themeId } },
      update: { note, presence, intensity, threadRole },
      create: { chapterId, themeId, note, presence, intensity, threadRole },
    });

    return NextResponse.json({ themeNote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
