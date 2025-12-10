import { prisma } from "@/lib/prisma";
import type { Feedback, User } from "@prisma/client";

import { FeedbackTable } from "./FeedbackTable";

export default async function AdminFeedbackPage() {
  const feedbackEntries = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Feedback</h1>
        <p className="text-slate-600">
          Review user-submitted feedback, track resolution status, and sort by
          recency.
        </p>
      </div>

      <FeedbackTable
        feedback={feedbackEntries.map((entry: (typeof feedbackEntries)[0]) => ({
          id: entry.id,
          message: entry.message,
          status: entry.status,
          pagePath: entry.pagePath,
          userEmail: entry.userEmail ?? entry.user?.email ?? undefined,
          userName: entry.user?.name ?? undefined,
          createdAt: entry.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
