import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/requireUser";
import { importBookTemplate } from "@/server/books/importBookTemplate";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params;
    const user = await requireAdmin();

    const body = await request.json();

    await importBookTemplate(prisma, bookId, user.id, body);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    
    let status = 500;
    if (message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")) {
      status = 401;
    } else if (message.toLowerCase().includes("not found")) {
      status = 404;
    } else if (message.toLowerCase().includes("invalid")) {
      status = 400;
    }

    return NextResponse.json({ error: message }, { status });
  }
}
