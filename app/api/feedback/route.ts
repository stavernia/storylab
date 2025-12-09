import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth/requireUser";

interface FeedbackPayload {
  message: string;
  pagePath?: string;
  context?: unknown;
  contactEmail?: string;
}

// TODO: Expose feedback entries via an /admin/feedback view to review submissions.
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as Partial<FeedbackPayload>;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const pagePath = typeof body.pagePath === "string" ? body.pagePath : undefined;
    const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : undefined;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await prisma.feedback.create({
      data: {
        message,
        pagePath,
        userId: user.id,
        userEmail: user.email ?? contactEmail ?? undefined,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      const location = pagePath ? ` on ${pagePath}` : "";
      console.info(`Received feedback from user ${user.id}${location}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.toLowerCase().includes("unauthorized") ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
