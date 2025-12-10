import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/requireUser";
import { authOptions } from "@/server/auth/options";

// TODO: don't hardcode roles
type Role = "ADMIN" | "EDITOR" | "READER" | "VIEWER";

const validRoles = new Set<Role>(["ADMIN", "EDITOR", "READER", "VIEWER"]);

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role, disabled, showOnboardingTour } = body ?? {};

    if (typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const data: {
      role?: Role;
      disabled?: boolean;
      showOnboardingTour?: boolean;
    } = {};

    if (typeof role !== "undefined") {
      if (!validRoles.has(role as Role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      data.role = role as Role;
    }

    if (typeof disabled === "boolean") {
      data.disabled = disabled;
    }

    if (typeof showOnboardingTour === "boolean") {
      data.showOnboardingTour = showOnboardingTour;
    }

    const isSelfTourToggle =
      session.user.id === userId &&
      typeof showOnboardingTour === "boolean" &&
      Object.keys(data).length === 1;

    if (!isSelfTourToggle && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        showOnboardingTour: true,
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
