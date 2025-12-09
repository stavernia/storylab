import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/requireUser";

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { userId, role, disabled } = body ?? {};

    if (typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const data: { role?: Role; disabled?: boolean } = {};

    if (typeof role !== "undefined") {
      if (!Object.values(Role).includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = role;
    }

    if (typeof disabled === "boolean") {
      data.disabled = disabled;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        disabled: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const lowerMessage = message.toLowerCase();
    const status = lowerMessage.includes("unauthorized")
      ? 401
      : lowerMessage.includes("forbidden")
        ? 403
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
