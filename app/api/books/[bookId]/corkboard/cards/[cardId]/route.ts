import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertCardAccess(cardId: string, bookId: string, userId: string) {
  return prisma.corkboardCard.findFirst({
    where: { id: cardId, bookId, book: { userId } },
  });
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
  _request: Request,
  { params }: { params: Promise<{ bookId: string; cardId: string }> },
) {
  try {
    const { bookId, cardId } = await params;
    const user = await requireUser();

    const card = await assertCardAccess(cardId, bookId, user.id);

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; cardId: string }> },
) {
  try {
    const { bookId, cardId } = await params;
    const user = await requireUser();

    const existing = await assertCardAccess(cardId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const bodyBookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (bodyBookId && bodyBookId !== bookId) {
      return NextResponse.json(
        { error: "Mismatched bookId for card update" },
        { status: 400 },
      );
    }

    const requestedBoardId =
      body.boardId === null
        ? null
        : typeof body.boardId === "string"
          ? body.boardId
          : undefined;
    const requestedChapterId =
      body.chapterId === null
        ? null
        : typeof body.chapterId === "string"
          ? body.chapterId
          : undefined;
    const requestedPartId =
      body.partId === null
        ? null
        : typeof body.partId === "string"
          ? body.partId
          : undefined;

    if (typeof requestedBoardId === "string") {
      const board = await assertBoardAccess(requestedBoardId, bookId, user.id);
      if (!board) {
        return NextResponse.json({ error: "Board not found" }, { status: 404 });
      }
    }

    if (typeof requestedChapterId === "string") {
      const chapter = await assertChapterAccess(requestedChapterId, bookId, user.id);
      if (!chapter) {
        return NextResponse.json(
          { error: "Chapter does not belong to this book" },
          { status: 400 },
        );
      }
    }

    if (typeof requestedPartId === "string") {
      const part = await assertPartAccess(requestedPartId, bookId, user.id);
      if (!part) {
        return NextResponse.json(
          { error: "Part does not belong to this book" },
          { status: 400 },
        );
      }
    }

    const data: {
      title?: string;
      summary?: string | null;
      notes?: string | null;
      status?: string | null;
      color?: string | null;
      laneRank?: string;
      wordEstimate?: number | null;
      chapterId?: string | null;
      partId?: string | null;
      boardId?: string | null;
      x?: number | null;
      y?: number | null;
      scope?: string | null;
    } = {};

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (title) {
        data.title = title;
      }
    }

    if ("summary" in body) {
      data.summary = typeof body.summary === "string" ? body.summary : null;
    }

    if ("notes" in body) {
      data.notes = typeof body.notes === "string" ? body.notes : null;
    }

    if ("status" in body) {
      data.status = typeof body.status === "string" ? body.status : null;
    }

    if ("color" in body) {
      data.color = typeof body.color === "string" ? body.color : null;
    }

    if (typeof body.laneRank === "string") {
      data.laneRank = body.laneRank;
    }

    if ("wordEstimate" in body) {
      data.wordEstimate = Number.isFinite(body.wordEstimate)
        ? body.wordEstimate
        : null;
    }

    if ("chapterId" in body) {
      data.chapterId = requestedChapterId ?? null;
    }

    if ("partId" in body) {
      data.partId = requestedPartId ?? null;
    }

    if ("boardId" in body) {
      data.boardId = requestedBoardId ?? null;
    }

    if ("x" in body) {
      data.x = Number.isFinite(body.x) ? body.x : null;
    }

    if ("y" in body) {
      data.y = Number.isFinite(body.y) ? body.y : null;
    }

    if ("scope" in body) {
      data.scope = typeof body.scope === "string" ? body.scope : null;
    }

    const card = await prisma.corkboardCard.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ card });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; cardId: string }> },
) {
  try {
    const { bookId, cardId } = await params;
    const user = await requireUser();

    const existing = await assertCardAccess(cardId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.tagLink.deleteMany({
        where: {
          entityId: existing.id,
          entityType: "card",
          bookId,
          book: { userId: user.id },
        },
      }),
      prisma.corkboardCard.delete({ where: { id: existing.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
