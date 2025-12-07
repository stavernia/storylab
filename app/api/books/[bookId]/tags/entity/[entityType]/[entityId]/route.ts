import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

type EntityScope = "chapter" | "theme" | "character" | "card" | "grid_cell";

async function resolveEntity(
  entityType: EntityScope,
  entityId: string,
  bookId: string,
  userId: string,
) {
  if (entityType === "chapter") {
    return prisma.chapter.findFirst({ where: { id: entityId, bookId, book: { userId } } });
  }

  if (entityType === "theme") {
    return prisma.theme.findFirst({ where: { id: entityId, bookId, book: { userId } } });
  }

  if (entityType === "character") {
    return prisma.character.findFirst({ where: { id: entityId, bookId, book: { userId } } });
  }

  if (entityType === "card") {
    return prisma.corkboardCard.findFirst({
      where: { id: entityId, bookId, book: { userId } },
    });
  }

  return null;
}

async function assertBookAccess(bookId: string, userId: string) {
  return prisma.book.findFirst({ where: { id: bookId, userId } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; entityType: string; entityId: string }> },
) {
  try {
    const { bookId, entityId, entityType } = await params;
    const user = await requireUser();
    const normalizedType = entityType as EntityScope;

    const book = await assertBookAccess(bookId, user.id);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const entity = await resolveEntity(normalizedType, entityId, bookId, user.id);

    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const links = await prisma.tagLink.findMany({
      where: { entityId, entityType: normalizedType, bookId, book: { userId: user.id } },
      include: { tag: true },
    });

    const tags = links.map((link) => link.tag);

    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string; entityType: string; entityId: string }> },
) {
  try {
    const { bookId, entityId, entityType } = await params;
    const user = await requireUser();
    const normalizedType = entityType as EntityScope;

    const body = await request.json();
    const tagId = typeof body.tagId === "string" ? body.tagId : "";

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const [book, entity, tag] = await Promise.all([
      assertBookAccess(bookId, user.id),
      resolveEntity(normalizedType, entityId, bookId, user.id),
      prisma.tag.findFirst({ where: { id: tagId, bookId, book: { userId: user.id } } }),
    ]);

    if (!book || !entity || !tag) {
      return NextResponse.json({ error: "Tag or entity not found" }, { status: 404 });
    }

    await prisma.tagLink.upsert({
      where: { tagId_entityType_entityId: { tagId, entityType: normalizedType, entityId } },
      update: {},
      create: { tagId, entityType: normalizedType, entityId, bookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string; entityType: string; entityId: string }> },
) {
  try {
    const { bookId, entityId, entityType } = await params;
    const user = await requireUser();
    const normalizedType = entityType as EntityScope;
    const body = await request.json();
    const tagId = typeof body.tagId === "string" ? body.tagId : "";

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const [book, entity, tag] = await Promise.all([
      assertBookAccess(bookId, user.id),
      resolveEntity(normalizedType, entityId, bookId, user.id),
      prisma.tag.findFirst({ where: { id: tagId, bookId, book: { userId: user.id } } }),
    ]);

    if (!book || !entity || !tag) {
      return NextResponse.json({ error: "Tag or entity not found" }, { status: 404 });
    }

    await prisma.tagLink.deleteMany({
      where: {
        tagId,
        entityId,
        entityType: normalizedType,
        bookId,
        book: { userId: user.id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
