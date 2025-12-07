import { NextResponse } from "next/server";

import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/server/auth/requireUser";

async function assertThemeAccess(themeId: string, bookId: string, userId: string) {
  return prisma.theme.findFirst({
    where: { id: themeId, bookId, book: { userId } },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; themeId: string }> },
) {
  try {
    const { bookId, themeId } = await params;
    const user = await requireUser();

    const theme = await assertThemeAccess(themeId, bookId, user.id);

    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    return NextResponse.json({ theme });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookId: string; themeId: string }> },
) {
  try {
    const { bookId, themeId } = await params;
    const user = await requireUser();

    const existing = await assertThemeAccess(themeId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    const body = await request.json();
    const name =
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : undefined;
    const color = typeof body.color === "string" ? body.color : undefined;

    const updated = await prisma.theme.update({
      where: { id: existing.id },
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
        rowOrder: Number.isFinite(body.rowOrder) ? body.rowOrder : undefined,
        isHidden: typeof body.isHidden === "boolean" ? body.isHidden : undefined,
        threadLabel:
          typeof body.threadLabel === "string" ? body.threadLabel : undefined,
      },
    });

    return NextResponse.json({ theme: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ bookId: string; themeId: string }> },
) {
  try {
    const { bookId, themeId } = await params;
    const user = await requireUser();

    const existing = await assertThemeAccess(themeId, bookId, user.id);

    if (!existing) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    await prisma.theme.update({
      where: { id: existing.id },
      data: { isHidden: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
