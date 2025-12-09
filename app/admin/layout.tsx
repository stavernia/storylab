import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, LayoutDashboard, MessageSquare, Users } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/components/ui/utils";
import { requireAdmin } from "@/server/auth/requireUser";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    redirect("/app");
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          </main>

          <aside className="flex w-20 border-l border-slate-200 bg-white/80 backdrop-blur-sm flex-col items-center gap-4 py-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/app"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-11 w-11 rounded-xl bg-slate-900 text-white shadow-md hover:bg-slate-800",
                  )}
                  aria-label="Back to app"
                >
                  <BookOpenText className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">Back to app</TooltipContent>
            </Tooltip>

            <div className="h-px w-9 bg-slate-200" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-11 w-11 rounded-xl text-slate-600 hover:bg-slate-100",
                  )}
                  aria-label="Admin overview"
                >
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">Admin overview</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/users"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-11 w-11 rounded-xl text-slate-600 hover:bg-slate-100",
                  )}
                  aria-label="User management"
                >
                  <Users className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">User management</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/admin/feedback"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-11 w-11 rounded-xl text-slate-600 hover:bg-slate-100",
                  )}
                  aria-label="Feedback"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="left">Feedback</TooltipContent>
            </Tooltip>

          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
}
