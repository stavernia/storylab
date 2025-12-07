import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertCharacterAccess(characterId: string, bookId: string, userId: string) {
  return prisma.character.findFirst({
    where: { id: characterId, bookId, book: { userId } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; characterId: string }> },
) {
  try {
    const { bookId, characterId } = await params;
    const user = await requireUser();

    const character = await assertCharacterAccess(characterId, bookId, user.id);

    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json({ character });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; characterId: string }> },
) {
  try {
    const { bookId, characterId } = await params;
    const user = await requireUser();

    const existing = await assertCharacterAccess(characterId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
    const color = typeof body.color === "string" ? body.color : undefined;

    const character = await prisma.character.update({
      where: { id: existing.id },
      data: {
        name,
        color,
        role: typeof body.role === "string" ? body.role : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
      },
    });

    return NextResponse.json({ character });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; characterId: string }> },
) {
  try {
    const { bookId, characterId } = await params;
    const user = await requireUser();

    const existing = await assertCharacterAccess(characterId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    await prisma.character.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
