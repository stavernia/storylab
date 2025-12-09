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

    const boards = await prisma.corkboardBoard.findMany({
      where: { bookId, book: { userId: user.id } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ boards });
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

    const body = await request.json().catch(() => ({}));
    const bodyBookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (bodyBookId && bodyBookId !== bookId) {
      return NextResponse.json(
        { error: "Mismatched bookId for board creation" },
        { status: 400 },
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description : undefined;
    const sortOrder = Number.isFinite(body.sortOrder) ? body.sortOrder : 0;

    if (!name) {
      return NextResponse.json({ error: "Board name is required" }, { status: 400 });
    }

    const board = await prisma.corkboardBoard.create({
      data: { name, description, sortOrder, bookId },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
