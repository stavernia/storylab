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

    const characters = await prisma.character.findMany({
      where: { bookId, book: { userId: user.id } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ characters });
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

    const character = await prisma.character.create({
      data: {
        name,
        color,
        role: typeof body.role === "string" ? body.role : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        bookId,
      },
    });

    return NextResponse.json({ character }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
