import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

async function assertChapterScope(bookId: string, chapterId: string) {
  return prisma.chapter.findFirst({ where: { id: chapterId, bookId } });
}

export async function PATCH(
  request: Request,
  { params }: { params: { bookId: string; chapterId: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existing = await assertChapterScope(params.bookId, params.chapterId);

    if (!existing) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const body = await request.json();
    const nextPartId =
      typeof body.partId === "string" ? body.partId : existing.partId;

    if (nextPartId) {
      const part = await prisma.part.findFirst({
        where: { id: nextPartId, bookId: params.bookId },
      });

      if (!part) {
        return NextResponse.json(
          { error: "Part does not belong to this book" },
          { status: 400 },
        );
      }
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.content === "string") updates.content = body.content;
    if (Number.isFinite(body.wordCount)) updates.wordCount = body.wordCount;
    if (Number.isFinite(body.sortOrder)) updates.sortOrder = body.sortOrder;
    if (typeof nextPartId === "string") updates.partId = nextPartId;
    if (body.lastEdited) updates.lastEdited = new Date(body.lastEdited);

    if (typeof body.outline === "string") updates.outline = body.outline;
    if (typeof body.outlinePOV === "string") updates.outlinePOV = body.outlinePOV;
    if (typeof body.outlinePurpose === "string")
      updates.outlinePurpose = body.outlinePurpose;
    if (Number.isFinite(body.outlineEstimate))
      updates.outlineEstimate = body.outlineEstimate;
    if (typeof body.outlineGoal === "string") updates.outlineGoal = body.outlineGoal;
    if (typeof body.outlineConflict === "string")
      updates.outlineConflict = body.outlineConflict;
    if (typeof body.outlineStakes === "string")
      updates.outlineStakes = body.outlineStakes;
    if (body.customOutlineFields)
      updates.customOutlineFields = body.customOutlineFields;

    const updated = await prisma.chapter.update({
      where: { id: params.chapterId },
      data: updates,
    });

    return NextResponse.json({ chapter: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { bookId: string; chapterId: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existing = await assertChapterScope(params.bookId, params.chapterId);

    if (!existing) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await prisma.chapter.delete({ where: { id: params.chapterId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
