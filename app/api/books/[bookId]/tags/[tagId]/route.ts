import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

async function assertTagAccess(tagId: string, bookId: string, userId: string) {
  return prisma.tag.findFirst({ where: { id: tagId, bookId, book: { userId } } });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; tagId: string }> },
) {
  try {
    const { bookId, tagId } = await params;
    const user = await requireUser();

    const tag = await assertTagAccess(tagId, bookId, user.id);

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; tagId: string }> },
) {
  try {
    const { bookId, tagId } = await params;
    const user = await requireUser();

    const existing = await assertTagAccess(tagId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" && body.name.trim()
        ? body.name.trim().toLowerCase()
        : undefined;
    const color = typeof body.color === "string" ? body.color : undefined;

    if (name && name !== existing.name) {
      const duplicate = await prisma.tag.findFirst({
        where: { name, bookId, book: { userId: user.id }, NOT: { id: existing.id } },
      });

      if (duplicate) {
        return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
      }
    }

    const tag = await prisma.tag.update({
      where: { id: existing.id },
      data: { name, color },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; tagId: string }> },
) {
  try {
    const { bookId, tagId } = await params;
    const user = await requireUser();

    const existing = await assertTagAccess(tagId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tagLink.deleteMany({
      where: { tagId: existing.id, bookId, book: { userId: user.id } },
    });

    await prisma.tag.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
