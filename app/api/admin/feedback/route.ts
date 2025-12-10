import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/requireUser";
// TODO: don't hardcode statuses
type FeedbackStatus = "WAITING" | "IN_PROGRESS" | "CANCELLED" | "COMPLETE";

const validStatuses = new Set<FeedbackStatus>([
  "WAITING",
  "IN_PROGRESS",
  "CANCELLED",
  "COMPLETE",
]);

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { feedbackId, status } = body ?? {};

    if (typeof feedbackId !== "string") {
      return NextResponse.json({ error: "feedbackId is required" }, { status: 400 });
    }

    if (typeof status !== "string" || !validStatuses.has(status as FeedbackStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const normalizedStatus: FeedbackStatus = status as FeedbackStatus;

    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status: normalizedStatus },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const lowerMessage = message.toLowerCase();
    const statusCode = lowerMessage.includes("unauthorized")
      ? 401
      : lowerMessage.includes("forbidden")
        ? 403
        : 500;

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
