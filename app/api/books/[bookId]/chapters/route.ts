import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
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

    const chapters = await prisma.chapter.findMany({
      where: { bookId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ chapters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string; chapterId?: string; partId?: string }> },
) {
  try {
    const { bookId } = await params;
    const user = await requireUser();
    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const body = await request.json();
    const bodyBookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (bodyBookId && bodyBookId !== bookId) {
      return NextResponse.json(
        { error: "Mismatched bookId for chapter creation" },
        { status: 400 },
      );
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content : "";
    const partId = typeof body.partId === "string" ? body.partId : undefined;
    const sortOrder = Number.isFinite(body.sortOrder) ? body.sortOrder : 0;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (partId) {
      const part = await prisma.part.findFirst({
        where: { id: partId, bookId },
      });

      if (!part) {
        return NextResponse.json(
          { error: "Part does not belong to this book" },
          { status: 400 },
        );
      }
    }

    const chapter = await prisma.chapter.create({
      data: {
        title,
        content,
        sortOrder,
        bookId,
        partId,
        outline: typeof body.outline === "string" ? body.outline : undefined,
        outlinePOV:
          typeof body.outlinePOV === "string" ? body.outlinePOV : undefined,
        outlinePurpose:
          typeof body.outlinePurpose === "string" ? body.outlinePurpose : undefined,
        outlineEstimate: Number.isFinite(body.outlineEstimate)
          ? body.outlineEstimate
          : undefined,
        outlineGoal:
          typeof body.outlineGoal === "string" ? body.outlineGoal : undefined,
        outlineConflict:
          typeof body.outlineConflict === "string"
            ? body.outlineConflict
            : undefined,
        outlineStakes:
          typeof body.outlineStakes === "string" ? body.outlineStakes : undefined,
        customOutlineFields: body.customOutlineFields,
        wordCount: Number.isFinite(body.wordCount) ? body.wordCount : 0,
        lastEdited: body.lastEdited ? new Date(body.lastEdited) : undefined,
      },
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
