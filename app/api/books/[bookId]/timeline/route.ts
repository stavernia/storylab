import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";
import { assertBookAccess } from "@/server/auth/bookAccess";

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

    const [chapters, themes, gridCells] = await Promise.all([
      prisma.chapter.findMany({
        where: { bookId, book: { userId: user.id } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.theme.findMany({
        where: { bookId, book: { userId: user.id } },
        orderBy: [{ rowOrder: "asc" }, { name: "asc" }],
      }),
      prisma.gridCell.findMany({
        where: {
          bookId,
          book: { userId: user.id },
          chapter: { bookId, book: { userId: user.id } },
          theme: { bookId, book: { userId: user.id } },
        },
      }),
    ]);

    return NextResponse.json({ chapters, themes, gridCells });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
