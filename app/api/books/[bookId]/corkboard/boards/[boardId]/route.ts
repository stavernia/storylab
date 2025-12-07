import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertBoardAccess(boardId: string, bookId: string, userId: string) {
  return prisma.corkboardBoard.findFirst({
    where: { id: boardId, bookId, book: { userId } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; boardId: string }> },
) {
  try {
    const { bookId, boardId } = await params;
    const user = await requireUser();

    const board = await assertBoardAccess(boardId, bookId, user.id);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; boardId: string }> },
) {
  try {
    const { bookId, boardId } = await params;
    const user = await requireUser();

    const existing = await assertBoardAccess(boardId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const bodyBookId = typeof body.bookId === "string" ? body.bookId.trim() : "";
    if (bodyBookId && bodyBookId !== bookId) {
      return NextResponse.json(
        { error: "Mismatched bookId for board update" },
        { status: 400 },
      );
    }

    const data: {
      name?: string;
      description?: string | null;
      sortOrder?: number;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (name) {
        data.name = name;
      }
    }

    if ("description" in body) {
      data.description =
        typeof body.description === "string" ? body.description : null;
    }

    if (Number.isFinite(body.sortOrder)) {
      data.sortOrder = body.sortOrder;
    }

    const board = await prisma.corkboardBoard.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ board });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; boardId: string }> },
) {
  try {
    const { bookId, boardId } = await params;
    const user = await requireUser();

    const existing = await assertBoardAccess(boardId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.corkboardCard.updateMany({
        where: { boardId: existing.id, bookId, book: { userId: user.id } },
        data: { boardId: null },
      }),
      prisma.corkboardBoard.delete({ where: { id: existing.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
