import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

async function assertPartScope(bookId: string, partId: string) {
  return prisma.part.findFirst({ where: { id: partId, bookId } });
}

export async function PATCH(
  request: Request,
  { params }: { params: { bookId: string; partId: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existing = await assertPartScope(params.bookId, params.partId);

    if (!existing) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.notes === "string") updates.notes = body.notes;
    if (Number.isFinite(body.sortOrder)) updates.sortOrder = body.sortOrder;

    const part = await prisma.part.update({
      where: { id: params.partId },
      data: updates,
    });

    return NextResponse.json({ part });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { bookId: string; partId: string } },
) {
  try {
    const user = await requireUser();
    const book = await assertBookAccess(params.bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existing = await assertPartScope(params.bookId, params.partId);

    if (!existing) {
      return NextResponse.json({ error: "Part not found" }, { status: 404 });
    }

    await prisma.part.delete({ where: { id: params.partId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
