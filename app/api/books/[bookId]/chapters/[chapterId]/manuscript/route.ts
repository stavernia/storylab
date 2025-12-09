import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

async function assertChapterOwnership(bookId: string, chapterId: string, userId: string) {
  return prisma.chapter.findFirst({
    where: {
      id: chapterId,
      bookId,
      book: {
        userId,
      },
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> },
) {
  try {
    const { bookId, chapterId } = await params;
    const user = await requireUser();

    const chapter = await assertChapterOwnership(bookId, chapterId, user.id);

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({
      manuscript: {
        chapterId,
        bookId,
        content: chapter.content || "",
        wordCount: chapter.wordCount,
        lastEdited: chapter.lastEdited,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> },
) {
  try {
    const { bookId, chapterId } = await params;
    const user = await requireUser();

    const chapter = await assertChapterOwnership(bookId, chapterId, user.id);

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.content === "string") updates.content = body.content;
    if (Number.isFinite(body.wordCount)) updates.wordCount = body.wordCount;
    if (body.lastEdited) updates.lastEdited = new Date(body.lastEdited);

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: updates,
    });

    return NextResponse.json({
      manuscript: {
        chapterId,
        bookId,
        content: updated.content || "",
        wordCount: updated.wordCount,
        lastEdited: updated.lastEdited,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
