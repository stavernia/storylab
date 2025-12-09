import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { getInitialRank } from "@/utils/lexorank";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

async function assertBoardAccess(boardId: string, bookId: string, userId: string) {
  return prisma.corkboardBoard.findFirst({
    where: { id: boardId, bookId, book: { userId } },
  });
}

async function assertChapterAccess(chapterId: string, bookId: string, userId: string) {
  return prisma.chapter.findFirst({ where: { id: chapterId, bookId, book: { userId } } });
}

async function assertPartAccess(partId: string, bookId: string, userId: string) {
  return prisma.part.findFirst({ where: { id: partId, bookId, book: { userId } } });
}

export async function GET(
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

    const searchParams = new URL(request.url).searchParams;
    const boardId = searchParams.get("boardId") || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;
    const partId = searchParams.get("partId") || undefined;
    const scope = searchParams.get("scope") || undefined;

    if (boardId) {
      const board = await assertBoardAccess(boardId, bookId, user.id);
      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
    }

    const cards = await prisma.corkboardCard.findMany({
      where: {
        bookId,
        book: { userId: user.id },
        boardId,
        chapterId,
        partId,
        scope,
      },
      orderBy: [{ laneRank: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ cards });
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
        { error: "Mismatched bookId for card creation" },
        { status: 400 },
      );
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const laneRank =
      typeof body.laneRank === "string" && body.laneRank.trim()
        ? body.laneRank
        : getInitialRank();

    const requestedBoardId = typeof body.boardId === "string" ? body.boardId : undefined;
    const requestedChapterId =
      typeof body.chapterId === "string" ? body.chapterId : undefined;
    const requestedPartId = typeof body.partId === "string" ? body.partId : undefined;

    if (requestedBoardId) {
      const board = await assertBoardAccess(requestedBoardId, bookId, user.id);
      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
    }

    if (requestedChapterId) {
      const chapter = await assertChapterAccess(requestedChapterId, bookId, user.id);
      if (!chapter) {
        return NextResponse.json(
          { error: "Chapter does not belong to this book" },
          { status: 400 },
        );
      }
    }

    if (requestedPartId) {
      const part = await assertPartAccess(requestedPartId, bookId, user.id);
      if (!part) {
        return NextResponse.json(
          { error: "Part does not belong to this book" },
          { status: 400 },
        );
      }
    }

    const card = await prisma.corkboardCard.create({
      data: {
        title,
        summary: typeof body.summary === "string" ? body.summary : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        status: typeof body.status === "string" ? body.status : undefined,
        color: typeof body.color === "string" ? body.color : undefined,
        laneRank,
        wordEstimate: Number.isFinite(body.wordEstimate) ? body.wordEstimate : undefined,
        chapterId: requestedChapterId,
        partId: requestedPartId,
        boardId: requestedBoardId ?? null,
        bookId,
        x: Number.isFinite(body.x) ? body.x : null,
        y: Number.isFinite(body.y) ? body.y : null,
        scope: typeof body.scope === "string" ? body.scope : undefined,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
