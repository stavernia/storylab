// Minimal admin dashboard for managing StoryLab users.

import { prisma } from "@/lib/prisma";

import { UserTable } from "./UserTable";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          User administration
        </h1>
        <p className="text-slate-600">
          Review workspace members, toggle access, and grant admin privileges.
        </p>
      </div>

      <UserTable
        users={users.map((user: (typeof users)[0]) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
