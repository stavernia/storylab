import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; cellId: string }> },
) {
  try {
    const { bookId, cellId } = await params;
    const user = await requireUser();

    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existingCell = await prisma.gridCell.findFirst({
      where: {
        id: cellId,
        bookId,
        book: { userId: user.id },
        chapter: { bookId, book: { userId: user.id } },
        theme: { bookId, book: { userId: user.id } },
      },
    });

    if (!existingCell) {
      return NextResponse.json({ error: "Cell not found" }, { status: 404 });
    }

    const body = await request.json();
    const presence =
      typeof body.presence === "boolean" ? body.presence : existingCell.presence;
    const intensityValue = Number.isFinite(body.intensity)
      ? Math.round(body.intensity)
      : existingCell.intensity;
    const intensity = Math.max(0, Math.min(3, intensityValue));
    const note = typeof body.note === "string" ? body.note : existingCell.note;
    const threadRole =
      typeof body.threadRole === "string" ? body.threadRole : existingCell.threadRole;

    const hasContent =
      (note?.trim() ?? "") !== "" || presence === true || (intensity ?? 0) > 0 || !!threadRole;

    if (!hasContent) {
      await prisma.gridCell.delete({ where: { id: existingCell.id } });
      return NextResponse.json({ success: true, deleted: true });
    }

    const cell = await prisma.gridCell.update({
      where: { id: existingCell.id },
      data: { presence, intensity, note: note ?? null, threadRole },
    });

    return NextResponse.json({ cell });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; cellId: string }> },
) {
  try {
    const { bookId, cellId } = await params;
    const user = await requireUser();

    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const cell = await prisma.gridCell.findFirst({
      where: {
        id: cellId,
        bookId,
        book: { userId: user.id },
        chapter: { bookId, book: { userId: user.id } },
        theme: { bookId, book: { userId: user.id } },
      },
    });

    if (!cell) {
      return NextResponse.json({ error: "Cell not found" }, { status: 404 });
    }

    await prisma.gridCell.delete({ where: { id: cell.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
