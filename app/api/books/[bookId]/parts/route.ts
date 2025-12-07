import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

export async function GET(
  _request: Request,
  { params }: { params: { bookId: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const parts = await prisma.part.findMany({
      where: { bookId: params.bookId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ parts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { bookId: string; chapterId?: string; partId?: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const body = await request.json();
    const bodyBookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (bodyBookId && bodyBookId !== params.bookId) {
      return NextResponse.json(
        { error: "Mismatched bookId for part creation" },
        { status: 400 },
      );
    }
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes : undefined;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const part = await prisma.part.create({
      data: {
        title,
        notes,
        bookId: params.bookId,
        sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : 0,
      },
    });

    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
