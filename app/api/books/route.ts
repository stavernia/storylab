import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

export async function GET() {
  try {
    const user = await requireUser();

    const books = await prisma.book.findMany({
      where: { userId: user.id, isArchived: false },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ books });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description : undefined;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        title,
        description,
        userId: user.id,
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
