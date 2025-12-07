import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

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

    const themes = await prisma.theme.findMany({
      where: { bookId, book: { userId: user.id } },
      orderBy: [{ rowOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ themes });
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

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const color = typeof body.color === "string" ? body.color : "";

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 },
      );
    }

    const theme = await prisma.theme.create({
      data: {
        name,
        color,
        kind: typeof body.kind === "string" ? body.kind : undefined,
        source: typeof body.source === "string" ? body.source : undefined,
        mode: typeof body.mode === "string" ? body.mode : undefined,
        sourceRefId:
          typeof body.sourceRefId === "string" ? body.sourceRefId : undefined,
        description:
          typeof body.description === "string" ? body.description : undefined,
        aiGuide: typeof body.aiGuide === "string" ? body.aiGuide : undefined,
        rowOrder: Number.isFinite(body.rowOrder) ? body.rowOrder : null,
        isHidden: typeof body.isHidden === "boolean" ? body.isHidden : undefined,
        threadLabel:
          typeof body.threadLabel === "string" ? body.threadLabel : undefined,
        bookId,
      },
    });

    return NextResponse.json({ theme }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
